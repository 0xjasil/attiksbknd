import { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCodeOrMessage?: number | string,
  maybeStatusCode?: number
) {
  const statusCode = typeof statusCodeOrMessage === 'number' ? statusCodeOrMessage : (maybeStatusCode ?? 200);
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendError(
  res: Response,
  error: string | any = 'An error occurred',
  statusCode = 500,
  _extra?: any
) {
  return res.status(statusCode).json({
    success: false,
    error: typeof error === 'string' ? error : (error?.message || error),
  });
}
