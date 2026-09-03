import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/jwt';
import { sendError } from '../utils/response';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required. Please provide a valid Bearer token.', 401);
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyJwt(token);

  if (!payload) {
    return sendError(res, 'Invalid or expired token.', 401);
  }

  req.user = payload;
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Access forbidden: Insufficient permissions.', 403);
    }
    next();
  };
}
