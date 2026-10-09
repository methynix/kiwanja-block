import { z } from 'zod';

export const verifyNidaSchema = z.object({
  nin: z.string().regex(/^\d{20}$/, 'NIN must be exactly 20 digits'),
  fullName: z.string().min(3),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});