import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { HttpError } from './error.js';
import { db, DB } from '../db/couch.js';
import { logger } from '../utils/logger.js';

export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Sign in to continue'));

  let claims;
  try {
    claims = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
  } catch {
    return next(new HttpError(401, 'Your session has expired', undefined, 'TOKEN_EXPIRED'));
  }

  try {
    await db(DB.sessions).head(claims.sid);
  } catch (err) {
    if (err.statusCode === 404) return next(new HttpError(401, 'Your session has ended', undefined, 'SESSION_ENDED'));
    return next(err);
  }

  req.user = claims;
  next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, 'Sign in to continue'));
    if (!roles.includes(req.user.role)) {
      logger.security('permission_denied', {
        userId: req.user.sub,
        role: req.user.role,
        method: req.method,
        path: req.originalUrl,
      });
      return next(new HttpError(403, 'Your account is not allowed to do this'));
    }
    next();
  };
}
