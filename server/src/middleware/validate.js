import { HttpError } from './error.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(new HttpError(400, 'Some fields are missing or invalid', result.error.flatten()));
  }
  if (source === 'body') req.body = result.data;
  else req.valid = { ...req.valid, [source]: result.data };
  next();
};
