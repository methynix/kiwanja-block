import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { createPlotSchema, listPlotsSchema, verifyHashSchema } from './plots.schemas.js';
import * as plotsService from './plots.service.js';
import { listTransactionsForPlot } from '../transactions/transactions.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { verifyLimiter } from '../../middleware/security.js';

export const plotsRouter = Router();

plotsRouter.get('/:id/verify', verifyLimiter, validate(verifyHashSchema, 'query'), async (req, res) => {
  res.json(await plotsService.verifyPlot(req.params.id, req.valid.query.h));
});

plotsRouter.use(requireAuth);

plotsRouter.post('/', requireRole('officer', 'mwenyekiti'), validate(createPlotSchema), async (req, res) => {
  res.status(201).json(await plotsService.createPlot(req.body, req.user));
});

plotsRouter.get('/', validate(listPlotsSchema, 'query'), async (req, res) => {
  res.json({ plots: await plotsService.listPlots(req.user, req.valid.query) });
});

plotsRouter.get('/:id', async (req, res) => {
  const plot = await plotsService.getPlot(req.params.id, req.user);
  const transactions = await listTransactionsForPlot(plot.id, req.user);
  res.json({ plot, transactions });
});

plotsRouter.get('/:id/qr', async (req, res) => {
  res.json(await plotsService.getPlotQr(req.params.id, req.user));
});
