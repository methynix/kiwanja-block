import { db, DB } from '../../db/couch.js';
import { newId } from '../../utils/ids.js';
import { HttpError } from '../../middleware/error.js';
import {
  buildSigningPayload,
  computeSignature,
  computeTransactionHash,
} from '../../utils/hash.js';
import { getPlotById } from '../plots/plots.service.js';
import { getUserById } from '../auth/auth.service.js';

const txDb = () => db(DB.transactions);
const plotsDb = () => db(DB.plots);

/**
 * Create a transaction. Called by the SELLER (who must own the plot).
 * The seller is derived from the plot's ownerNin.
 * The leader is the authenticated mwenyekiti.
 */
export async function createTransaction(input, actor) {
  // 1. Load and validate the plot
  const plot = await getPlotById(input.plotId);
  if (plot.status !== 'active') {
    throw new HttpError(409, 'Plot is not active for sale');
  }

  // 2. Ensure the plot is not already locked by another open transaction
  const openTx = await findOpenTransactionForPlot(plot._id);
  if (openTx) {
    throw new HttpError(409, 'Plot already has an open transaction', {
      transactionId: openTx._id,
      status: openTx.status,
    });
  }

  // 3. Ensure the actor is a mwenyekiti in the plot's ward
  if (actor.role !== 'mwenyekiti') {
    throw new HttpError(403, 'Only a Mwenyekiti can open a transaction');
  }
  if (actor.ward && actor.ward !== plot.ward) {
    throw new HttpError(403, 'Mwenyekiti is not assigned to this ward');
  }

  const now = new Date().toISOString();
  const transactionId = newId('tx');

  const transaction = {
    _id: transactionId,
    type: 'transaction',
    status: 'draft',
    plotId: plot._id,
    plotNumber: plot.plotNumber,
    ward: plot.ward,
    district: plot.district,
    region: plot.region,
    gps: plot.gps ?? null,
    currency: input.currency ?? 'TZS',
    priceTzs: input.priceTzs,
    notes: input.notes ?? null,
    seller: {
      nin: plot.ownerNin,
      fullName: plot.ownerName,
      userId: plot.createdBy ?? null,
    },
    buyer: {
      nin: input.buyer.nin,
      fullName: input.buyer.fullName,
      phone: input.buyer.phone ?? null,
      userId: null,
    },
    leader: {
      userId: actor.sub,
      fullName: actor.fullName,
      ward: actor.ward ?? plot.ward,
    },
    signatures: {
      seller: null,
      buyer: null,
      leader: null,
    },
    signedAt: {
      seller: null,
      buyer: null,
      leader: null,
    },
    transactionHash: null,
    createdBy: actor.sub,
    createdAt: now,
    updatedAt: now,
  };

  await txDb().insert(transaction);
  await appendAudit({
    actor: actor.sub,
    action: 'transaction.create',
    transactionId,
    plotId: plot._id,
  });

  return publicTransaction(transaction);
}

/**
 * Sign a transaction. Any of the three parties can call this.
 * The caller must provide the role and their identifier.
 * We verify the identifier matches the party on the transaction.
 */
export async function signTransaction(transactionId, { role, identifier, signature }, actor) {
  const tx = await getTransactionById(transactionId);

  if (tx.status === 'completed') {
    throw new HttpError(409, 'Transaction already completed');
  }
  if (tx.status === 'cancelled') {
    throw new HttpError(409, 'Transaction was cancelled');
  }

  // Verify the identifier matches the party
  const expected = expectedIdentifierFor(tx, role);
  if (expected !== identifier) {
    throw new HttpError(403, `Identifier does not match the ${role} on this transaction`);
  }

  // If the client sent its own signature, verify it matches ours
  const payload = buildSigningPayload(tx);
  const expectedSig = computeSignature(payload, role, identifier);
  if (signature && signature !== expectedSig) {
    throw new HttpError(400, 'Provided signature does not match computed signature');
  }

  // Idempotency: already signed? Just return.
  if (tx.signatures[role]) {
    return publicTransaction(tx);
  }

  const now = new Date().toISOString();
  tx.signatures[role] = expectedSig;
  tx.signedAt[role] = now;
  tx.updatedAt = now;

  // Advance state machine
  tx.status = nextStatus(tx);

  // If all three signed, compute the final transaction hash
  if (tx.status === 'completed') {
    tx.transactionHash = computeTransactionHash(payload, tx.signatures);
    tx.completedAt = now;
  }

  await txDb().insert(tx);
  await appendAudit({
    actor: actor.sub,
    action: `transaction.sign.${role}`,
    transactionId,
    plotId: tx.plotId,
  });

  return publicTransaction(tx);
}

export async function getTransactionById(id) {
  try {
    return await txDb().get(id);
  } catch (err) {
    if (err.statusCode === 404) throw new HttpError(404, 'Transaction not found');
    throw err;
  }
}

export async function listTransactionsForPlot(plotId) {
  const result = await txDb().view('by_plot', 'by_plot', {
    startkey: [plotId, ''],
    endkey: [plotId, '\ufff0'],
    include_docs: true,
  });
  return result.rows.map((r) => publicTransaction(r.doc));
}

export async function listTransactionsForUser(userId) {
  const result = await txDb().view('by_party', 'by_party', {
    include_docs: true,
  });
  // Filter client-side for the specific user (small hackathon dataset)
  return result.rows
    .filter((r) => r.value === userId)
    .map((r) => publicTransaction(r.doc));
}

/**
 * Public verification of a completed transaction's hash.
 * Anyone with the transactionId can recompute and compare.
 */
export async function verifyTransactionHash(transactionId, providedHash) {
  const tx = await getTransactionById(transactionId);
  if (tx.status !== 'completed') {
    return { valid: false, reason: 'Transaction not completed' };
  }
  const payload = buildSigningPayload(tx);
  const recomputed = computeTransactionHash(payload, tx.signatures);
  return {
    valid: recomputed === providedHash && tx.transactionHash === providedHash,
    storedHash: tx.transactionHash,
    providedHash,
    recomputedHash: recomputed,
    signatures: tx.signatures,
  };
}

/* ---------- helpers ---------- */

function expectedIdentifierFor(tx, role) {
  if (role === 'seller') return tx.seller.nin;
  if (role === 'buyer') return tx.buyer.nin;
  if (role === 'leader') return tx.leader.userId;
  throw new HttpError(400, `Unknown role: ${role}`);
}

function nextStatus(tx) {
  const s = tx.signatures;
  if (s.seller && s.buyer && s.leader) return 'completed';
  if (s.seller && s.buyer) return 'pending_leader';
  if (s.seller) return 'pending_buyer';
  return 'draft';
}

async function findOpenTransactionForPlot(plotId) {
  const result = await txDb().view('by_plot', 'by_plot', {
    startkey: [plotId, ''],
    endkey: [plotId, '\ufff0'],
    include_docs: true,
  });
  const open = result.rows.find(
    (r) => r.doc.status !== 'completed' && r.doc.status !== 'cancelled',
  );
  return open?.doc ?? null;
}

function publicTransaction(tx) {
  const { _rev, ...rest } = tx;
  return rest;
}

/* ---------- audit ---------- */

async function appendAudit(entry) {
  const auditDb = db(DB.audit);
  await auditDb.insert({
    _id: newId('audit'),
    type: 'audit',
    ...entry,
    at: new Date().toISOString(),
  });
}