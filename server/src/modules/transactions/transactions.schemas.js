import { z } from 'zod';

const partySchema = z.object({
  nin: z.string().regex(/^\d{20}$/, 'NIN must be 20 digits'),
  fullName: z.string().min(3),
  phone: z.string().regex(/^\+?255\d{9}$/).optional(),
});

export const createTransactionSchema = z.object({
  plotId: z.string().min(1),
  buyer: partySchema,
  priceTzs: z.number().positive(),
  currency: z.literal('TZS').default('TZS'),
  // Seller is derived from the plot's owner — client doesn't send it.
  // Leader is derived from the authenticated user — client doesn't send it.
  notes: z.string().max(500).optional(),
});

export const signSchema = z.object({
  role: z.enum(['seller', 'buyer', 'leader']),
  identifier: z.string().min(3), // NIN for citizens, userId for leader
  // Optional: client can send its own computed signature to compare
  signature: z.string().length(64).optional(),
});