import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { verifyNidaSchema } from './nida.schemas.js';
import { lookupNida, verifyNida } from './nida.service.js';
import { requireAuth } from '../../middleware/auth.js';

export const nidaRouter = Router();

nidaRouter.get('/lookup/:nin', requireAuth, async (req, res, next) => {
  try {
    const record = await lookupNida({ nin: req.params.nin });
    res.json(record);
  } catch (err) {
    next(err);
  }
});

nidaRouter.post(
  '/verify',
  requireAuth,
  validate(verifyNidaSchema),
  async (req, res, next) => {
    try {
      const result = await verifyNida(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);