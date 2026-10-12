import { z } from 'zod';
import { ninSchema } from '../nida/nida.schemas.js';

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s+/g, ''))
  .pipe(z.string().regex(/^\+255\d{9}$/, 'Phone must look like +255712345678'));

const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(72, 'Password must be at most 72 characters');

export const registerSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(3).max(120),
  nin: ninSchema,
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD'),
  acceptTerms: z.literal(true, { error: 'You must accept the terms and privacy policy' }),
});

export const createStaffSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(3).max(120),
  role: z.enum(['mwenyekiti', 'officer']),
  ward: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  region: z.string().trim().min(2).max(80),
});

export const loginSchema = z.object({
  phone: z.string().trim().max(20),
  password: z.string().max(72),
});
