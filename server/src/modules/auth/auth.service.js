import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db, DB, viewDocs } from '../../db/couch.js';
import { config } from '../../config/index.js';
import { newId } from '../../utils/ids.js';
import { sha256, timingSafeEqualHex } from '../../utils/hash.js';
import { HttpError } from '../../middleware/error.js';
import { logger, maskPhone } from '../../utils/logger.js';
import { requireNidaMatch } from '../nida/nida.service.js';

const usersDb = () => db(DB.users);
const sessionsDb = () => db(DB.sessions);
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

async function findByPhone(phone) {
  const docs = await viewDocs(DB.users, 'users', 'by_phone', { key: phone });
  return docs[0] ?? null;
}

async function findByNin(nin) {
  const docs = await viewDocs(DB.users, 'users', 'by_nin', { key: nin });
  return docs[0] ?? null;
}

export function publicUser(u) {
  return {
    id: u._id,
    phone: u.phone,
    fullName: u.fullName,
    role: u.role,
    nin: u.nin ?? null,
    ward: u.ward ?? null,
    district: u.district ?? null,
    region: u.region ?? null,
    createdAt: u.createdAt,
  };
}

async function insertUser(fields) {
  if (await findByPhone(fields.phone)) {
    throw new HttpError(409, 'An account could not be created with these details');
  }
  const user = {
    _id: newId('user'),
    type: 'user',
    ...fields,
    passwordHash: await bcrypt.hash(fields.password, 12),
    createdAt: new Date().toISOString(),
  };
  delete user.password;
  await usersDb().insert(user);
  return user;
}

export async function registerCitizen(input) {
  const nida = await requireNidaMatch(input, 'Identity check');
  if (await findByNin(input.nin)) {
    throw new HttpError(409, 'An account could not be created with these details');
  }
  const user = await insertUser({
    phone: input.phone,
    password: input.password,
    fullName: input.fullName.trim().replace(/\s+/g, ' '),
    role: 'citizen',
    nin: input.nin,
    region: nida.record.region,
    district: nida.record.district,
    termsAcceptedAt: new Date().toISOString(),
  });
  logger.info('user_registered', { userId: user._id, role: 'citizen' });
  return publicUser(user);
}

export async function createStaff(input, actor) {
  const user = await insertUser({ ...input });
  logger.info('staff_created', { userId: user._id, role: user.role, by: actor.sub });
  return publicUser(user);
}

export async function listStaff() {
  const [leaders, officers] = await Promise.all(
    ['mwenyekiti', 'officer'].map((role) =>
      viewDocs(DB.users, 'users', 'by_role', { startkey: [role, ''], endkey: [role, '￰'] }),
    ),
  );
  return [...officers, ...leaders].map(publicUser);
}

function signAccessToken(user, sid) {
  return jwt.sign(
    { sub: user._id, sid, role: user.role, fullName: user.fullName, ward: user.ward ?? null, nin: user.nin ?? null },
    config.jwt.secret,
    { expiresIn: config.jwt.accessTtl, algorithm: 'HS256' },
  );
}

function newSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function expiry() {
  return new Date(Date.now() + config.refresh.ttlDays * 86_400_000).toISOString();
}

async function openSession(user, meta) {
  const secret = newSecret();
  const session = {
    _id: newId('session'),
    type: 'session',
    userId: user._id,
    refreshHash: sha256(secret),
    createdAt: new Date().toISOString(),
    expiresAt: expiry(),
    userAgent: (meta.userAgent ?? '').slice(0, 200),
  };
  await sessionsDb().insert(session);
  return { refreshToken: `${session._id}.${secret}`, accessToken: signAccessToken(user, session._id) };
}

export async function login({ phone, password }, meta) {
  const normalized = phone.replace(/\s+/g, '');
  const user = await findByPhone(normalized);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    logger.security('login_failed', { ip: meta.ip, phone: maskPhone(normalized) });
    throw new HttpError(401, 'Phone number or password is incorrect');
  }
  const tokens = await openSession(user, meta);
  logger.info('login_succeeded', { userId: user._id });
  return { ...tokens, user: publicUser(user) };
}

async function loadSession(refreshToken) {
  const [sid, secret] = String(refreshToken ?? '').split('.');
  if (!sid?.startsWith('session_') || !secret) return null;
  try {
    const session = await sessionsDb().get(sid);
    return { session, secret };
  } catch (err) {
    if (err.statusCode === 404) return null;
    throw err;
  }
}

export async function refresh(refreshToken, meta) {
  const loaded = await loadSession(refreshToken);
  if (!loaded) throw new HttpError(401, 'Sign in to continue');
  const { session, secret } = loaded;

  if (!timingSafeEqualHex(sha256(secret), session.refreshHash)) {
    await sessionsDb().destroy(session._id, session._rev).catch(() => {});
    logger.security('refresh_token_reuse', { ip: meta.ip, userId: session.userId });
    throw new HttpError(401, 'Sign in to continue');
  }
  if (session.expiresAt < new Date().toISOString()) {
    await sessionsDb().destroy(session._id, session._rev).catch(() => {});
    throw new HttpError(401, 'Your session has expired. Sign in again.');
  }

  const user = await usersDb().get(session.userId).catch(() => null);
  if (!user) throw new HttpError(401, 'Sign in to continue');

  const nextSecret = newSecret();
  await sessionsDb().insert({ ...session, refreshHash: sha256(nextSecret), expiresAt: expiry(), rotatedAt: new Date().toISOString() });

  return {
    refreshToken: `${session._id}.${nextSecret}`,
    accessToken: signAccessToken(user, session._id),
    user: publicUser(user),
  };
}

export async function logout(refreshToken, actor) {
  const sid = actor?.sid ?? String(refreshToken ?? '').split('.')[0];
  if (!sid?.startsWith('session_')) return;
  try {
    const session = await sessionsDb().get(sid);
    await sessionsDb().destroy(session._id, session._rev);
  } catch (err) {
    if (err.statusCode !== 404) throw err;
  }
}

export async function getUserById(id) {
  try {
    return publicUser(await usersDb().get(id));
  } catch (err) {
    if (err.statusCode === 404) throw new HttpError(404, 'User not found');
    throw err;
  }
}
