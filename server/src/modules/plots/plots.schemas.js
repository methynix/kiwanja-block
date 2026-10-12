import { z } from 'zod';
import { ninSchema } from '../nida/nida.schemas.js';

export const gpsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().nonnegative().max(100_000).optional(),
});

export const createPlotSchema = z.object({
  plotNumber: z.string().trim().min(1).max(40),
  ward: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  region: z.string().trim().min(2).max(80),
  sizeSqm: z.number().positive().max(10_000_000),
  landUse: z.enum(['residential', 'agricultural', 'mixed']).default('residential'),
  ownerNin: ninSchema,
  ownerName: z.string().trim().min(3).max(120),
  gps: gpsSchema.nullable().optional(),
});

export const listPlotsSchema = z.object({
  ward: z.string().trim().min(2).max(80).optional(),
});

export const verifyHashSchema = z.object({
  h: z.string().regex(/^[0-9a-f]{64}$/, 'Hash must be 64 hexadecimal characters'),
});
