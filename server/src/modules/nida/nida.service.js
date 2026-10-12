import { config } from '../../config/index.js';
import { HttpError } from '../../middleware/error.js';
import { NIDA_RECORDS } from './nida.data.js';

const normalizeName = (name) => name.trim().replace(/\s+/g, ' ').toLowerCase();

async function fetchRecord(nin) {
  if (!config.nidaMock) {
    throw new HttpError(503, 'The live NIDA service is not connected in this build');
  }
  await new Promise((r) => setTimeout(r, config.env === 'test' ? 0 : 150));
  return NIDA_RECORDS.find((r) => r.nin === nin) ?? null;
}

export async function lookupNida(nin) {
  const record = await fetchRecord(nin);
  if (!record) throw new HttpError(404, 'No citizen with this NIN was found in NIDA');
  return {
    nin: record.nin,
    fullName: record.fullName,
    region: record.region,
    district: record.district,
    source: config.nidaMock ? 'MOCK_NIDA' : 'NIDA',
  };
}

export async function verifyNida({ nin, fullName, dateOfBirth }) {
  const record = await fetchRecord(nin);
  if (!record) {
    return { nin, found: false, match: false, checks: { nameMatches: false, dobMatches: false } };
  }
  const nameMatches = normalizeName(record.fullName) === normalizeName(fullName);
  const dobMatches = dateOfBirth === undefined ? null : record.dateOfBirth === dateOfBirth;
  return {
    nin,
    found: true,
    match: nameMatches && dobMatches !== false,
    checks: { nameMatches, dobMatches },
    record: { region: record.region, district: record.district },
  };
}

export async function requireNidaMatch({ nin, fullName, dateOfBirth }, label) {
  const result = await verifyNida({ nin, fullName, dateOfBirth });
  if (!result.found) throw new HttpError(422, `${label}: NIN was not found in NIDA`, undefined, 'NIDA_NOT_FOUND');
  if (!result.checks.nameMatches) {
    throw new HttpError(422, `${label}: the name does not match the NIDA record for this NIN`, undefined, 'NIDA_NAME_MISMATCH');
  }
  if (result.checks.dobMatches === false) {
    throw new HttpError(422, `${label}: the date of birth does not match NIDA`, undefined, 'NIDA_DOB_MISMATCH');
  }
  return result;
}
