import { config } from '../../config/index.js';
import { hashRecord } from '../../utils/hash.js';

const MOCK_NAMES = [
  'Helen Method James',
  'Ayman Masoud Kapela',
  'Chibobo Masudi Kapela',
  'Abby Masudi Method',
  'Angel Stephen Mwendi',
];

function seededIndex(seed, mod) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h % mod;
}

export async function lookupNida({ nin }) {
  if (!config.nidaMock) {
    throw new Error('Live NIDA integration is not enabled');
  }

  
  await new Promise((r) => setTimeout(r, 250));

  const idx = seededIndex(nin, MOCK_NAMES.length);
  const record = {
    nin,
    fullName: MOCK_NAMES[idx],
    dateOfBirth: '1990-01-01', // simplified
    region: 'Dodoma',
    district: 'Dodoma Urban',
    verified: true,
    source: 'MOCK_NIDA',
    fetchedAt: new Date().toISOString(),
  };

  record.integrityHash = hashRecord({
    nin: record.nin,
    fullName: record.fullName,
    dateOfBirth: record.dateOfBirth,
  });

  return record;
}

export async function verifyNida({ nin, fullName, dateOfBirth }) {
  const record = await lookupNida({ nin });

  const nameMatches =
    record.fullName.toLowerCase() === fullName.toLowerCase();
  const dobMatches = record.dateOfBirth === dateOfBirth;

  return {
    nin,
    match: nameMatches && dobMatches,
    checks: { nameMatches, dobMatches },
    record,
  };
}