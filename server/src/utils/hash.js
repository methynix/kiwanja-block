import crypto from 'node:crypto';

export function sha256(input) {
  const data = typeof input === 'string' ? input : JSON.stringify(input);
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function canonicalize(obj) {
  // Stable stringify (sorted keys) so hashes are deterministic
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(canonicalize).join(',')}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
}

export function hashRecord(obj) {
  return sha256(canonicalize(obj));
}

/**
 * Build the canonical payload that all three parties sign.
 * Order of keys is normalized by canonicalize().
 */
export function buildSigningPayload(transaction) {
  return {
    transactionId: transaction._id,
    plotId: transaction.plotId,
    plotNumber: transaction.plotNumber,
    ward: transaction.ward,
    priceTzs: transaction.priceTzs,
    currency: transaction.currency ?? 'TZS',
    sellerNin: transaction.seller.nin,
    buyerNin: transaction.buyer.nin,
    leaderUserId: transaction.leader.userId,
    createdAt: transaction.createdAt,
  };
}

/**
 * Signature = SHA256(payload | role | identifier)
 * identifier is the party's unique ID (NIN for citizens, userId for leader).
 *
 * NOTE: In production, replace this with real asymmetric signatures
 * (Ed25519). Each party holds a private key; the backend only verifies.
 */
export function computeSignature(payload, role, identifier) {
  const canonical = canonicalize(payload);
  return sha256(`${canonical}|${role}|${identifier}`);
}

/**
 * Final transaction hash — the fingerprint of the whole deal.
 */
export function computeTransactionHash(payload, signatures) {
  const canonical = canonicalize(payload);
  const parts = [
    canonical,
    signatures.seller,
    signatures.buyer,
    signatures.leader,
  ].join('|');
  return sha256(parts);
}