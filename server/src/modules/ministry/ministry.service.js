import crypto from 'node:crypto';
import { config } from '../../config/index.js';

export async function submitPendingTransfer(tx) {
  await new Promise((r) => setTimeout(r, config.env === 'test' ? 0 : 300));
  const year = new Date().getFullYear();
  const wardCode = tx.ward.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'WRD';
  return {
    reference: `MOL/${year}/${wardCode}/${crypto.randomInt(100000, 999999)}`,
    status: 'received',
    receivedAt: new Date().toISOString(),
    system: 'MOCK_MINISTRY_OF_LANDS',
  };
}
