import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import {
  createTransactionSchema,
  signSchema,
} from './transactions.schemas.js';
import * as txService from './transactions.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export const transactionsRouter = Router();

// Create a new transaction — only a Mwenyekiti can open one
transactionsRouter.post(
  '/',
  requireAuth,
  requireRole('mwenyekiti'),
  validate(createTransactionSchema),
  async (req, res, next) => {
    try {
      const tx = await txService.createTransaction(req.body, req.user);
      res.status(201).json({ transaction: tx });
    } catch (err) {
      next(err);
    }
  },
);

// Get a transaction
transactionsRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const tx = await txService.getTransactionById(req.params.id);
    res.json({ transaction: tx });
  } catch (err) {
    next(err);
  }
});

// Sign a transaction — any authenticated party can call
transactionsRouter.post(
  '/:id/sign',
  requireAuth,
  validate(signSchema),
  async (req, res, next) => {
    try {
      const tx = await txService.signTransaction(
        req.params.id,
        req.body,
        req.user,
      );
      res.json({ transaction: tx });
    } catch (err) {
      next(err);
    }
  },
);

// List transactions for a plot
transactionsRouter.get(
  '/by-plot/:plotId',
  requireAuth,
  async (req, res, next) => {
    try {
      const txs = await txService.listTransactionsForPlot(req.params.plotId);
      res.json({ transactions: txs });
    } catch (err) {
      next(err);
    }
  },
);

// List transactions the current user is a party to
transactionsRouter.get('/mine/all', requireAuth, async (req, res, next) => {
  try {
    const txs = await txService.listTransactionsForUser(req.user.sub);
    res.json({ transactions: txs });
  } catch (err) {
    next(err);
  }
});

// Public verification of a completed transaction hash
transactionsRouter.get('/:id/verify', async (req, res, next) => {
  try {
    const { hash } = req.query;
    const result = await txService.verifyTransactionHash(req.params.id, hash);
    res.json(result);
  } catch (err) {
    next(err);
  }
});