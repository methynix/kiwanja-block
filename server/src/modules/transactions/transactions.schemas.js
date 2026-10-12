import { z } from 'zod';
import { ninSchema } from '../nida/nida.schemas.js';
import { gpsSchema } from '../plots/plots.schemas.js';

const hex64 = z.string().regex(/^[0-9a-f]{64}$/, 'Must be a 64 character SHA-256 hex digest');

const partyEvidenceSchema = z.object({
  signedAt: z.iso.datetime(),
  gps: gpsSchema.nullable(),
  photo: z.string().max(1_700_000),
  consent: z.literal(true, { error: 'Each party must consent before signing' }),
  signature: hex64,
});

const personSchema = z.object({
  nin: ninSchema,
  fullName: z.string().trim().min(3).max(120),
});

export const submitTransactionSchema = z.object({
  id: z.string().regex(/^tx_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, 'Invalid transaction id'),
  plotId: z.string().min(1).max(80),
  priceTzs: z.number().int().positive().max(1e13),
  currency: z.literal('TZS'),
  notes: z.string().trim().max(500).optional(),
  createdAt: z.iso.datetime(),
  capturedOffline: z.boolean(),
  seller: personSchema,
  buyer: personSchema,
  evidence: z.object({
    seller: partyEvidenceSchema,
    buyer: partyEvidenceSchema,
    leader: partyEvidenceSchema,
  }),
});

export const listTransactionsSchema = z.object({
  ward: z.string().trim().min(2).max(80).optional(),
});

export const roleParamSchema = z.enum(['seller', 'buyer', 'leader']);

export { hex64 };
