import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class HttpError extends Error {
  constructor(status, message, details, code) {
    super(message);
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export function notFound(req, _res, next) {
  next(new HttpError(404, 'Route not found'));
}

export function errorHandler(err, req, res, _next) {
  const status = err.status ?? err.statusCode ?? 500;
  const isClientError = status >= 400 && status < 500;

  if (!isClientError) {
    logger.error('unhandled_error', {
      method: req.method,
      path: req.originalUrl,
      message: err.message,
      stack: config.isProd ? undefined : err.stack,
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request is too large' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }

  const payload = {
    error: isClientError || !config.isProd ? err.message : 'Something went wrong on our side. Please try again.',
  };
  if (isClientError && err.details) payload.details = err.details;
  if (isClientError && err.code) payload.code = err.code;
  res.status(isClientError ? status : 500).json(payload);
}
