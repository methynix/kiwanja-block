import QRCode from 'qrcode';
import { db, DB, viewDocs } from '../../db/couch.js';
import { config } from '../../config/index.js';
import { newId } from '../../utils/ids.js';
import { hashRecord, plotCore } from '../../utils/hash.js';
import { HttpError } from '../../middleware/error.js';
import { requireNidaMatch } from '../nida/nida.service.js';
import { appendAudit } from '../audit/audit.service.js';

const plotsDb = () => db(DB.plots);

export const plotVerificationUrl = (plotId, hash) =>
  `${config.frontendUrl}/verify/plot/${encodeURIComponent(plotId)}?h=${hash}`;

export function qrDataUrl(text) {
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 1, width: 360 });
}

export function sealPlot(plot) {
  const integrityHash = hashRecord(plotCore(plot));
  return { ...plot, integrityHash, verificationUrl: plotVerificationUrl(plot.plotId, integrityHash) };
}

export function assertWardAccess(actor, ward) {
  if (actor.role === 'mwenyekiti' && actor.ward !== ward) {
    throw new HttpError(403, 'You can only work with plots in your own ward');
  }
}

export async function createPlot(input, actor) {
  assertWardAccess(actor, input.ward);
  await requireNidaMatch({ nin: input.ownerNin, fullName: input.ownerName }, 'Plot owner');

  const existing = await plotsDb().view('plots', 'by_plot_number', { key: [input.ward, input.plotNumber] });
  if (existing.rows.length > 0) throw new HttpError(409, 'This plot number is already registered in this ward');

  const plotId = newId('plot');
  const now = new Date().toISOString();
  const doc = sealPlot({
    _id: plotId,
    type: 'plot',
    status: 'active',
    plotId,
    plotNumber: input.plotNumber,
    ward: input.ward,
    district: input.district,
    region: input.region,
    sizeSqm: input.sizeSqm,
    landUse: input.landUse,
    ownerNin: input.ownerNin,
    ownerName: input.ownerName.trim().replace(/\s+/g, ' '),
    gps: input.gps ?? null,
    registeredAt: now,
    ownerSince: now,
    registeredBy: actor.sub,
    ownershipHistory: [],
    previousHashes: [],
    lastTransactionId: null,
  });

  await plotsDb().insert(doc);
  await appendAudit({ actor: actor.sub, action: 'plot.register', plotId });
  return { plot: publicPlot(doc), qrDataUrl: await qrDataUrl(doc.verificationUrl) };
}

export async function getPlotDoc(id) {
  try {
    const doc = await plotsDb().get(id);
    if (doc.type !== 'plot') throw new HttpError(404, 'Plot not found');
    return doc;
  } catch (err) {
    if (err.statusCode === 404) throw new HttpError(404, 'Plot not found');
    throw err;
  }
}

export function assertPlotReadable(actor, plot) {
  if (actor.role === 'officer') return;
  if (actor.role === 'mwenyekiti' && actor.ward === plot.ward) return;
  if (actor.role === 'citizen' && actor.nin === plot.ownerNin) return;
  throw new HttpError(404, 'Plot not found');
}

export async function getPlot(id, actor) {
  const plot = await getPlotDoc(id);
  assertPlotReadable(actor, plot);
  return publicPlot(plot);
}

export async function listPlots(actor, { ward } = {}) {
  let docs;
  if (actor.role === 'citizen') {
    docs = await viewDocs(DB.plots, 'plots', 'by_owner', { key: actor.nin });
  } else if (actor.role === 'mwenyekiti') {
    docs = await viewDocs(DB.plots, 'plots', 'by_ward', { key: actor.ward });
  } else if (ward) {
    docs = await viewDocs(DB.plots, 'plots', 'by_ward', { key: ward });
  } else {
    docs = await viewDocs(DB.plots, 'plots', 'by_ward', { limit: 500 });
  }
  return docs
    .map(publicPlot)
    .sort((a, b) => a.ward.localeCompare(b.ward) || a.plotNumber.localeCompare(b.plotNumber, undefined, { numeric: true }));
}

export async function getPlotQr(id, actor) {
  const plot = await getPlotDoc(id);
  assertPlotReadable(actor, plot);
  return { plotId: id, verificationUrl: plot.verificationUrl, qrDataUrl: await qrDataUrl(plot.verificationUrl) };
}

const maskName = (name) =>
  name
    .split(' ')
    .map((part) => `${part[0]}${'*'.repeat(Math.max(part.length - 1, 2))}`)
    .join(' ');

export async function verifyPlot(id, hash) {
  let plot;
  try {
    plot = await getPlotDoc(id);
  } catch (err) {
    if (err.status === 404) return { found: false, valid: false, state: 'unknown' };
    throw err;
  }
  const recomputed = hashRecord(plotCore(plot));
  const intact = recomputed === plot.integrityHash;
  const current = intact && hash === plot.integrityHash;
  const superseded = !current && plot.previousHashes.includes(hash);

  return {
    found: true,
    valid: current,
    state: !intact ? 'tampered' : current ? 'current' : superseded ? 'superseded' : 'mismatch',
    plot: {
      plotNumber: plot.plotNumber,
      ward: plot.ward,
      district: plot.district,
      region: plot.region,
      sizeSqm: plot.sizeSqm,
      landUse: plot.landUse,
      status: plot.status,
      ownerInitials: maskName(plot.ownerName),
      ownerSince: plot.ownerSince,
      transfers: plot.ownershipHistory.length,
    },
  };
}

export function publicPlot(doc) {
  const { _rev, _id, type, ...rest } = doc;
  return { id: _id, ...rest };
}
