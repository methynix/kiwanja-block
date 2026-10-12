import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { ninSchema, verifyNidaSchema } from './nida.schemas.js';
import { lookupNida, verifyNida } from './nida.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { HttpError } from '../../middleware/error.js';

export const nidaRouter = Router();

nidaRouter.use(requireAuth, requireRole('mwenyekiti', 'officer'));

nidaRouter.get('/lookup/:nin', async (req, res) => {
  const parsed = ninSchema.safeParse(req.params.nin);
  if (!parsed.success) throw new HttpError(400, 'NIN must be exactly 20 digits');
  res.json(await lookupNida(parsed.data));
});

nidaRouter.post('/verify', validate(verifyNidaSchema), async (req, res) => {
  res.json(await verifyNida(req.body));
});
