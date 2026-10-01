export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, _next) {
  const status = err.status ?? 500;
  const payload = {
    error: err.message ?? 'Internal Server Error',
  };
  if (err.details) payload.details = err.details;
  if (status >= 500) console.error(err);
  res.status(status).json(payload);
}