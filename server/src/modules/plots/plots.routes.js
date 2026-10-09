import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { createPlotSchema, verifyPlotSchema } from './plots.schemas.js';
import * as plotsService from './plots.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export const plotsRouter = Router();

// Register a new plot — officers or mwenyekiti
plotsRouter.post(
  '/',
  requireAuth,
  requireRole('officer', 'mwenyekiti'),
  validate(createPlotSchema),
  async (req, res, next) => {
    try {
      const result = await plotsService.createPlot(req.body, req.user.sub);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// List plots (optionally filter by ward)
plotsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const plots = await plotsService.listPlots({ ward: req.query.ward });
    res.json({ plots });
  } catch (err) {
    next(err);
  }
});

// Get a single plot
plotsRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const plot = await plotsService.getPlotById(req.params.id);
    res.json({ plot });
  } catch (err) {
    next(err);
  }
});

// Get the QR code for a plot
plotsRouter.get('/:id/qr', requireAuth, async (req, res, next) => {
  try {
    const qr = await plotsService.getPlotQr(req.params.id);
    res.json(qr);
  } catch (err) {
    next(err);
  }
});

// Public verification (no auth — anyone scanning the QR can verify)
plotsRouter.get('/:id/verify', async (req, res, next) => {
  try {
    const { hash } = verifyPlotSchema.parse(req.query);
    const result = await plotsService.verifyPlot(req.params.id, hash);
    res.json(result);
  } catch (err) {
    next(err);
  }
});