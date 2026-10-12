import { z } from 'zod';

export const ninSchema = z.string().regex(/^\d{20}$/, 'NIN must be exactly 20 digits');

export const verifyNidaSchema = z.object({
  nin: ninSchema,
  fullName: z.string().trim().min(3).max(120),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
