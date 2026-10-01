import QRCode from 'qrcode';
import { db, DB } from '../../db/couch.js';
import { newId } from '../../utils/ids.js';
import { hashRecord } from '../../utils/hash.js';
import { HttpError } from '../../middleware/error.js';

const plotsDb = () => db(DB.plots);

export async function createPlot(input, createdBy) {
  // Uniqueness check: same ward + plot number must not exist
  const existing = await plotsDb().view('by_plot_number', 'by_plot_number', {
    key: [input.ward, input.plotNumber],
  });
  if (existing.rows.length > 0) {
    throw new HttpError(409, 'Plot already registered in this ward');
  }

  const plotId = newId('plot');

  // Canonical core — this is what gets hashed
  const core = {
    plotId,
    plotNumber: input.plotNumber,
    ward: input.ward,
    district: input.district,
    region: input.region,
    sizeSqm: input.sizeSqm,
    landUse: input.landUse,
    ownerNin: input.ownerNin,
    ownerName: input.ownerName,
    gps: input.gps ?? null,
    registeredAt: new Date().toISOString(),
  };

  const integrityHash = hashRecord(core);
  const verificationUrl = `https://kiwanja.go.tz/verify/plot/${plotId}?h=${integrityHash}`;

  const doc = {
    _id: plotId,
    type: 'plot',
    status: 'active',
    createdBy,
    ...core,
    integrityHash,
    verificationUrl,
  };

  await plotsDb().insert(doc);

  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 400,
  });

  return { plot: doc, qrDataUrl };
}

export async function getPlotById(id) {
  try {
    const doc = await plotsDb().get(id);
    return doc;
  } catch (err) {
    if (err.statusCode === 404) throw new HttpError(404, 'Plot not found');
    throw err;
  }
}

export async function verifyPlot(id, hash) {
  const plot = await getPlotById(id);
  const core = {
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
  };
  const recomputed = hashRecord(core);

  return {
    plotId: id,
    valid: recomputed === hash && plot.integrityHash === hash,
    storedHash: plot.integrityHash,
    providedHash: hash,
    recomputedHash: recomputed,
  };
}

export async function listPlots({ ward, limit = 50 } = {}) {
  if (ward) {
    const result = await plotsDb().view('by_plot_number', 'by_plot_number', {
      startkey: [ward, ''],
      endkey: [ward, '\ufff0'],
      include_docs: true,
      limit,
    });
    return result.rows.map((r) => r.doc);
  }

  const result = await plotsDb().allDocs({
    include_docs: true,
    limit,
  });
  return result.rows.map((r) => r.doc).filter((d) => d.type === 'plot');
}

export async function getPlotQr(id) {
  const plot = await getPlotById(id);
  const qrDataUrl = await QRCode.toDataURL(plot.verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 400,
  });
  return { plotId: id, verificationUrl: plot.verificationUrl, qrDataUrl };
}