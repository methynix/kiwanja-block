import express, { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { listTransactionsSchema, roleParamSchema, submitTransactionSchema, hex64 } from './transactions.schemas.js';
import * as txService from './transactions.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { verifyLimiter } from '../../middleware/security.js';
import { HttpError } from '../../middleware/error.js';
import { z } from 'zod';

export const transactionsRouter = Router();

transactionsRouter.get('/:id/verify', verifyLimiter, validate(z.object({ h: hex64 }), 'query'), async (req, res) => {
  res.json(await txService.verifyTransaction(req.params.id, req.valid.query.h));
});

transactionsRouter.use(requireAuth);

transactionsRouter.post(
  '/',
  requireRole('mwenyekiti'),
  express.json({ limit: '6mb' }),
  validate(submitTransactionSchema),
  async (req, res) => {
    const { transaction, duplicate } = await txService.submitTransaction(req.body, req.user);
    res.status(duplicate ? 200 : 201).json({ transaction, duplicate });
  },
);

transactionsRouter.get('/', validate(listTransactionsSchema, 'query'), async (req, res) => {
  res.json({ transactions: await txService.listTransactions(req.user, req.valid.query) });
});

transactionsRouter.get('/stats', requireRole('mwenyekiti', 'officer'), validate(listTransactionsSchema, 'query'), async (req, res) => {
  res.json(await txService.getStats(req.user, req.valid.query));
});

transactionsRouter.get('/:id', async (req, res) => {
  res.json({ transaction: await txService.getTransaction(req.params.id, req.user) });
});

transactionsRouter.get('/:id/certificate', async (req, res) => {
  res.json(await txService.getCertificate(req.params.id, req.user));
});

transactionsRouter.get('/:id/photos/:role', async (req, res) => {
  const role = roleParamSchema.safeParse(req.params.role);
  if (!role.success) throw new HttpError(404, 'Photo not found');
  const { buffer, contentType } = await txService.getPhoto(req.params.id, role.data, req.user);
  res.set('Content-Type', contentType);
  res.set('Content-Disposition', 'inline');
  res.send(buffer);
});

transactionsRouter.post('/:id/ministry', requireRole('mwenyekiti', 'officer'), async (req, res) => {
  res.json({ transaction: await txService.submitToMinistry(req.params.id, req.user) });
});
