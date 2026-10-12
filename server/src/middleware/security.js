import { rateLimit } from 'express-rate-limit';
import { config } from '../config/index.js';
import { logger, maskPhone } from '../utils/logger.js';

function limiter(windowMinutes, limit, message, onLimit) {
  return rateLimit({
    windowMs: windowMinutes * 60_000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => config.env === 'test',
    handler: (req, res, _next, options) => {
      onLimit?.(req);
      res.status(options.statusCode).json({ error: message });
    },
  });
}

export const apiLimiter = limiter(1, 300, 'Too many requests. Wait a minute and try again.');

export const loginLimiter = limiter(15, 10, 'Too many sign-in attempts. Wait 15 minutes and try again.', (req) =>
  logger.security('login_rate_limited', { ip: req.ip, phone: maskPhone(req.body?.phone) }),
);

export const registerLimiter = limiter(60, 10, 'Too many accounts created from this network. Try again later.');

export const verifyLimiter = limiter(1, 60, 'Too many verification checks. Wait a minute and try again.');

export function noStore(_req, res, next) {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  next();
}

export function enforceHttps(req, res, next) {
  if (!config.isProd || req.secure) return next();
  if (req.method === 'GET' || req.method === 'HEAD') {
    return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
  }
  res.status(403).json({ error: 'HTTPS is required' });
}

export function requireXhrHeader(req, res, next) {
  if (req.get('X-Requested-With') !== 'kiwanja') {
    logger.security('missing_csrf_header', { ip: req.ip, path: req.originalUrl });
    return res.status(403).json({ error: 'Request blocked' });
  }
  next();
}
