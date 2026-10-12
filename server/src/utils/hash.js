import crypto from 'node:crypto';

export function sha256(input) {
  const data = typeof input === 'string' || Buffer.isBuffer(input) ? input : JSON.stringify(input);
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function canonicalize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const keys = Object.keys(value)
    .filter((k) => value[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(',')}}`;
}

export function hashRecord(value) {
  return sha256(canonicalize(value));
}

export function plotCore(plot) {
  return {
    plotId: plot.plotId,
    plotNumber: plot.plotNumber,
    ward: plot.ward,
    district: plot.district,
    region: plot.region,
    sizeSqm: plot.sizeSqm,
    landUse: plot.landUse,
    ownerNin: plot.ownerNin,
    ownerName: plot.ownerName,
    gps: plot.gps ?? null,
    registeredAt: plot.registeredAt,
    ownerSince: plot.ownerSince ?? plot.registeredAt,
  };
}

export function buildSigningPayload(tx) {
  return {
    transactionId: tx.id,
    plotId: tx.plotId,
    plotNumber: tx.plotNumber,
    ward: tx.ward,
    priceTzs: tx.priceTzs,
    currency: tx.currency,
    sellerNin: tx.seller.nin,
    sellerName: tx.seller.fullName,
    buyerNin: tx.buyer.nin,
    buyerName: tx.buyer.fullName,
    leaderUserId: tx.leader.userId,
    createdAt: tx.createdAt,
  };
}

export function evidenceRecord({ photoHash, gps, signedAt }) {
  return { photoHash, gps: gps ?? null, signedAt };
}

export function computeSignature(payload, role, identifier, evidence) {
  return sha256(
    `${canonicalize(payload)}|${role}|${identifier}|${canonicalize(evidenceRecord(evidence))}`,
  );
}

export function computeTransactionHash(payload, signatures) {
  return sha256(
    [canonicalize(payload), signatures.seller, signatures.buyer, signatures.leader].join('|'),
  );
}

export function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
