import { z } from 'zod';

export const registerSchema = z.object({
  phone: z.string().regex(/^\+?255\d{9}$/, 'Phone must be +255XXXXXXXXX'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(3),
  role: z.enum(['mwenyekiti', 'citizen', 'officer']),
  nin: z.string().regex(/^\d{20}$/).optional(),
  ward: z.string().optional(),        // for mwenyekiti
  district: z.string().optional(),
  region: z.string().optional(),
});

export const loginSchema = z.object({
  phone: z.string(),
  password: z.string(),
});