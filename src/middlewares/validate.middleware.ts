import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/response';

export const validate = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.query !== undefined) req.query = parsed.query;
    if (parsed.params !== undefined) req.params = parsed.params;
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0]?.message || 'Validation error';
      return sendError(res, firstError, 400);
    }
    return sendError(res, 'Invalid request data', 400);
  }
};
