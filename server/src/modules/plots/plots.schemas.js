import { z } from 'zod';

export const createPlotSchema = z.object({
  plotNumber: z.string().min(1),
  ward: z.string().min(2),
  district: z.string().min(2),
  region: z.string().min(2),
  sizeSqm: z.number().positive(),
  landUse: z.enum(['residential', 'agricultural', 'mixed']).default('residential'),
  ownerNin: z.string().regex(/^\d{20}$/),
  ownerName: z.string().min(3),
  gps: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

export const verifyPlotSchema = z.object({
  hash: z.string().length(64),
});