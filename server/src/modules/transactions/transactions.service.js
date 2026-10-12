import { db, DB, viewDocs } from '../../db/couch.js';
import { config } from '../../config/index.js';
import { HttpError } from '../../middleware/error.js';
import {
  buildSigningPayload,
  computeSignature,
  computeTransactionHash,
  sha256,
} from '../../utils/hash.js';
import { distanceMeters } from '../../utils/geo.js';
import { logger } from '../../utils/logger.js';
import { assertWardAccess, getPlotDoc, qrDataUrl, sealPlot } from '../plots/plots.service.js';
import { requireNidaMatch } from '../nida/nida.service.js';
import { submitPendingTransfer } from '../ministry/ministry.service.js';
import { appendAudit } from '../audit/audit.service.js';

const txDb = () => db(DB.transactions);
const plotsDb = () => db(DB.plots);
const ROLES = ['seller', 'buyer', 'leader'];
const CLOCK_SKEW_MS = 5 * 60_000;
const MAX_OFFLINE_AGE_MS = 30 * 86_400_000;

const sameName = (a, b) => a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase();

export const txVerificationUrl = (id, hash) =>
  `${config.frontendUrl}/verify/tx/${encodeURIComponent(id)}?h=${hash}`;

function decodePhoto(dataUrl, role) {
  const match = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new HttpError(400, `The ${role} photo must be a JPEG or PNG image`, undefined, 'PHOTO_INVALID');
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0 || buffer.length > config.uploads.maxPhotoBytes) {
    throw new HttpError(413, `The ${role} photo is too large`, undefined, 'PHOTO_TOO_LARGE');
  }
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (!isJpeg && !isPng) {
    throw new HttpError(400, `The ${role} photo is not a real image file`, undefined, 'PHOTO_INVALID');
  }
  return { buffer, contentType: isJpeg ? 'image/jpeg' : 'image/png' };
}

function presenceOf(partyGps, plotGps) {
  if (!partyGps) return { presence: 'no_gps', distanceFromPlotM: null };
  if (!plotGps) return { presence: 'plot_has_no_gps', distanceFromPlotM: null };
  const distance = distanceMeters(partyGps, plotGps);
  return { presence: distance <= config.presenceRadiusM ? 'verified' : 'far', distanceFromPlotM: distance };
}

function checkTimeline(input) {
  const now = Date.now();
  const created = Date.parse(input.createdAt);
  const times = ROLES.map((r) => Date.parse(input.evidence[r].signedAt));
  if (created > now + CLOCK_SKEW_MS || times.some((t) => t > now + CLOCK_SKEW_MS)) {
    throw new HttpError(422, 'The handshake is dated in the future. Check the device clock.', undefined, 'CLOCK_INVALID');
  }
  if (now - created > MAX_OFFLINE_AGE_MS) {
    throw new HttpError(422, 'This handshake is older than 30 days and must be repeated', undefined, 'HANDSHAKE_EXPIRED');
  }
  if (!(created <= times[0] && times[0] <= times[1] && times[1] <= times[2])) {
    throw new HttpError(422, 'Signatures must be made in order: seller, then buyer, then Mwenyekiti', undefined, 'ORDER_INVALID');
  }
}

export function canReadTransaction(actor, tx) {
  if (actor.role === 'officer') return true;
  if (actor.role === 'mwenyekiti') return actor.ward === tx.ward;
  return actor.nin === tx.seller.nin || actor.nin === tx.buyer.nin;
}

async function loadTransaction(id) {
  try {
    const doc = await txDb().get(id);
    if (doc.type !== 'transaction') throw new HttpError(404, 'Transaction not found');
    return doc;
  } catch (err) {
    if (err.statusCode === 404) throw new HttpError(404, 'Transaction not found');
    throw err;
  }
}

async function loadReadable(id, actor) {
  const tx = await loadTransaction(id);
  if (!canReadTransaction(actor, tx)) throw new HttpError(404, 'Transaction not found');
  return tx;
}

export async function submitTransaction(input, actor) {
  const existing = await txDb().get(input.id).catch((err) => {
    if (err.statusCode === 404) return null;
    throw err;
  });
  if (existing) {
    if (existing.leader.userId === actor.sub) return { transaction: publicTransaction(existing), duplicate: true };
    throw new HttpError(409, 'A transaction with this id already exists');
  }

  const plot = await getPlotDoc(input.plotId);
  assertWardAccess(actor, plot.ward);
  if (plot.status !== 'active') throw new HttpError(409, 'This plot is not open for sale', undefined, 'PLOT_INACTIVE');

  if (plot.ownerNin !== input.seller.nin || !sameName(plot.ownerName, input.seller.fullName)) {
    logger.security('double_sale_blocked', { plotId: plot._id, transactionId: input.id, leader: actor.sub });
    throw new HttpError(
      409,
      'The seller is no longer the registered owner of this plot. The plot changed hands after this handshake was recorded, so this sale was not accepted.',
      undefined,
      'SELLER_NOT_OWNER',
    );
  }
  if (input.buyer.nin === input.seller.nin) {
    throw new HttpError(422, 'The buyer and seller cannot be the same person', undefined, 'SAME_PARTY');
  }

  checkTimeline(input);
  await requireNidaMatch(input.buyer, 'Buyer');

  const tx = {
    id: input.id,
    plotId: plot._id,
    plotNumber: plot.plotNumber,
    ward: plot.ward,
    priceTzs: input.priceTzs,
    currency: input.currency,
    seller: { nin: plot.ownerNin, fullName: plot.ownerName },
    buyer: { nin: input.buyer.nin, fullName: input.buyer.fullName.trim().replace(/\s+/g, ' ') },
    leader: { userId: actor.sub, fullName: actor.fullName },
    createdAt: input.createdAt,
  };
  const payload = buildSigningPayload(tx);
  const identifiers = { seller: tx.seller.nin, buyer: tx.buyer.nin, leader: tx.leader.userId };

  const evidence = {};
  const signatures = {};
  const attachments = [];
  for (const role of ROLES) {
    const party = input.evidence[role];
    const photo = decodePhoto(party.photo, role);
    const photoHash = sha256(photo.buffer);
    const expected = computeSignature(payload, role, identifiers[role], { photoHash, gps: party.gps, signedAt: party.signedAt });
    if (expected !== party.signature) {
      logger.security('signature_mismatch', { transactionId: input.id, role, leader: actor.sub });
      throw new HttpError(
        400,
        `The ${role} signature does not match the recorded evidence. The handshake may have been altered.`,
        undefined,
        'SIGNATURE_MISMATCH',
      );
    }
    signatures[role] = expected;
    evidence[role] = {
      signedAt: party.signedAt,
      gps: party.gps,
      photoHash,
      photoType: photo.contentType,
      ...presenceOf(party.gps, plot.gps),
    };
    attachments.push({ name: `${role}-photo`, data: photo.buffer, content_type: photo.contentType });
  }

  const transactionHash = computeTransactionHash(payload, signatures);
  const completedAt = input.evidence.leader.signedAt;

  const transferred = sealPlot({
    ...plot,
    ownerNin: tx.buyer.nin,
    ownerName: tx.buyer.fullName,
    ownerSince: completedAt,
    ownershipHistory: [
      ...plot.ownershipHistory,
      { ownerName: plot.ownerName, ownerNin: plot.ownerNin, from: plot.ownerSince, to: completedAt, transactionId: tx.id },
    ],
    previousHashes: [...plot.previousHashes, plot.integrityHash],
    lastTransactionId: tx.id,
  });

  try {
    const result = await plotsDb().insert(transferred);
    transferred._rev = result.rev;
  } catch (err) {
    if (err.statusCode === 409) {
      throw new HttpError(409, 'This plot was updated by another transaction at the same moment. Nothing was saved.', undefined, 'PLOT_CHANGED');
    }
    throw err;
  }

  const doc = {
    _id: tx.id,
    type: 'transaction',
    status: 'completed',
    plotId: tx.plotId,
    plotNumber: tx.plotNumber,
    ward: tx.ward,
    district: plot.district,
    region: plot.region,
    plotGps: plot.gps ?? null,
    priceTzs: tx.priceTzs,
    currency: tx.currency,
    notes: input.notes ?? null,
    seller: tx.seller,
    buyer: tx.buyer,
    leader: tx.leader,
    createdAt: tx.createdAt,
    completedAt,
    receivedAt: new Date().toISOString(),
    capturedOffline: input.capturedOffline,
    evidence,
    signatures,
    transactionHash,
    plotHashBefore: plot.integrityHash,
    plotHashAfter: transferred.integrityHash,
    ministry: null,
  };

  try {
    await txDb().multipart.insert(doc, attachments, doc._id);
  } catch (err) {
    await plotsDb()
      .insert({ ...plot, _rev: transferred._rev })
      .catch((revertErr) => logger.error('plot_revert_failed', { plotId: plot._id, message: revertErr.message }));
    throw err;
  }

  await appendAudit({ actor: actor.sub, action: 'transaction.complete', transactionId: tx.id, plotId: tx.plotId });
  return { transaction: publicTransaction(doc), duplicate: false };
}

export async function listTransactions(actor, { ward } = {}) {
  let docs;
  if (actor.role === 'citizen') {
    const rows = await viewDocs(DB.transactions, 'transactions', 'by_nin', {
      startkey: [actor.nin, ''],
      endkey: [actor.nin, '￰'],
    });
    docs = [...new Map(rows.map((d) => [d._id, d])).values()];
  } else {
    const scopeWard = actor.role === 'mwenyekiti' ? actor.ward : ward;
    docs = scopeWard
      ? await viewDocs(DB.transactions, 'transactions', 'by_ward', { startkey: [scopeWard, ''], endkey: [scopeWard, '￰'] })
      : await viewDocs(DB.transactions, 'transactions', 'all_by_date', { descending: true, limit: 500 });
  }
  return docs.map(publicTransaction).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listTransactionsForPlot(plotId, actor) {
  const docs = await viewDocs(DB.transactions, 'transactions', 'by_plot', {
    startkey: [plotId, ''],
    endkey: [plotId, '￰'],
  });
  return docs
    .filter((d) => canReadTransaction(actor, d))
    .map(publicTransaction)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getTransaction(id, actor) {
  return publicTransaction(await loadReadable(id, actor));
}

export async function getPhoto(id, role, actor) {
  const tx = await loadReadable(id, actor);
  const buffer = await txDb().attachment.get(tx._id, `${role}-photo`);
  return { buffer, contentType: tx.evidence[role].photoType };
}

export async function getCertificate(id, actor) {
  const tx = await loadReadable(id, actor);
  const verificationUrl = txVerificationUrl(tx._id, tx.transactionHash);
  return { transaction: publicTransaction(tx), verificationUrl, qrDataUrl: await qrDataUrl(verificationUrl) };
}

const initials = (name) =>
  name
    .split(' ')
    .map((part) => `${part[0]}${'*'.repeat(Math.max(part.length - 1, 2))}`)
    .join(' ');

export async function verifyTransaction(id, hash) {
  let tx;
  try {
    tx = await loadTransaction(id);
  } catch (err) {
    if (err.status === 404) return { found: false, valid: false, state: 'unknown' };
    throw err;
  }

  const payload = buildSigningPayload({ ...tx, id: tx._id });
  const identifiers = { seller: tx.seller.nin, buyer: tx.buyer.nin, leader: tx.leader.userId };
  const checks = {};
  for (const role of ROLES) {
    const photo = await txDb().attachment.get(tx._id, `${role}-photo`).catch(() => null);
    const photoIntact = photo !== null && sha256(photo) === tx.evidence[role].photoHash;
    const signatureIntact =
      computeSignature(payload, role, identifiers[role], tx.evidence[role]) === tx.signatures[role];
    checks[role] = { photoIntact, signatureIntact, presence: tx.evidence[role].presence };
  }
  const recomputed = computeTransactionHash(payload, tx.signatures);
  const intact = recomputed === tx.transactionHash && ROLES.every((r) => checks[r].photoIntact && checks[r].signatureIntact);
  const matches = hash === tx.transactionHash;

  return {
    found: true,
    valid: intact && matches,
    state: !intact ? 'tampered' : matches ? 'current' : 'mismatch',
    checks,
    transaction: {
      plotNumber: tx.plotNumber,
      ward: tx.ward,
      district: tx.district,
      region: tx.region,
      completedAt: tx.completedAt,
      sellerInitials: initials(tx.seller.fullName),
      buyerInitials: initials(tx.buyer.fullName),
      leaderName: tx.leader.fullName,
      ministryReference: tx.ministry?.reference ?? null,
    },
  };
}

export async function submitToMinistry(id, actor) {
  const tx = await loadReadable(id, actor);
  if (actor.role === 'mwenyekiti' && tx.leader.userId !== actor.sub) {
    throw new HttpError(403, 'Only the Mwenyekiti who witnessed this sale or a land officer can submit it');
  }
  if (tx.ministry) return publicTransaction(tx);

  const ministry = { ...(await submitPendingTransfer(tx)), submittedBy: actor.sub };
  const updated = { ...tx, ministry };
  try {
    await txDb().insert(updated);
  } catch (err) {
    if (err.statusCode === 409) throw new HttpError(409, 'This transaction changed while submitting. Refresh and try again.');
    throw err;
  }
  await appendAudit({ actor: actor.sub, action: 'transaction.ministry_submit', transactionId: tx._id, reference: ministry.reference });
  return publicTransaction(updated);
}

export async function getStats(actor, { ward } = {}) {
  const scopeWard = actor.role === 'mwenyekiti' ? actor.ward : ward;
  const transactions = await listTransactions(actor, { ward: scopeWard });
  const plots = scopeWard
    ? await db(DB.plots).view('plots', 'by_ward', { key: scopeWard })
    : await db(DB.plots).view('plots', 'by_ward', {});
  const since = Date.now() - 30 * 86_400_000;
  const flagged = (t) => ROLES.some((r) => ['far', 'no_gps'].includes(t.evidence?.[r]?.presence));

  return {
    ward: scopeWard ?? null,
    plots: plots.rows.length,
    transactions: transactions.length,
    last30Days: transactions.filter((t) => Date.parse(t.createdAt) >= since).length,
    valueTzs: transactions.reduce((sum, t) => sum + t.priceTzs, 0),
    awaitingMinistry: transactions.filter((t) => !t.ministry).length,
    submittedToMinistry: transactions.filter((t) => t.ministry).length,
    presenceFlagged: transactions.filter(flagged).length,
    capturedOffline: transactions.filter((t) => t.capturedOffline).length,
    recent: transactions.slice(0, 6),
  };
}

export function publicTransaction(doc) {
  const { _id, _rev, _attachments, type, ...rest } = doc;
  return { id: _id, ...rest };
}
