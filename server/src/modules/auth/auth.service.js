import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db, DB } from '../../db/couch.js';
import { config } from '../../config/index.js';
import { newId } from '../../utils/ids.js';
import { HttpError } from '../../middleware/error.js';

const usersDb = () => db(DB.users);

async function findByPhone(phone) {
  const result = await usersDb().view('by_phone', 'by_phone', {
    key: phone,
    include_docs: true,
  });
  return result.rows[0]?.doc ?? null;
}

export async function register(input) {
  const existing = await findByPhone(input.phone);
  if (existing) throw new HttpError(409, 'Phone already registered');

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = {
    _id: newId('user'),
    type: 'user',
    phone: input.phone,
    passwordHash,
    fullName: input.fullName,
    role: input.role,
    nin: input.nin ?? null,
    ward: input.ward ?? null,
    district: input.district ?? null,
    region: input.region ?? null,
    createdAt: new Date().toISOString(),
  };

  await usersDb().insert(user);

  return publicUser(user);
}

export async function login({ phone, password }) {
  const user = await findByPhone(phone);
  if (!user) throw new HttpError(401, 'Invalid credentials');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Invalid credentials');

  const token = jwt.sign(
    {
      sub: user._id,
      role: user.role,
      fullName: user.fullName,
      ward: user.ward,
    },
    config.jwt.secret,
    { expiresIn: '12h' },
  );

  return { token, user: publicUser(user) };
}

export async function getUserById(id) {
  try {
    const doc = await usersDb().get(id);
    return publicUser(doc);
  } catch (err) {
    if (err.statusCode === 404) throw new HttpError(404, 'User not found');
    throw err;
  }
}

function publicUser(u) {
  const { passwordHash, _rev, ...rest } = u;
  return rest;
}