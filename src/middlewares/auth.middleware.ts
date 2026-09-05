import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/jwt';
import { sendError } from '../utils/response';

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1].trim();
  }

  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    for (const c of cookies) {
      if (c.startsWith('attiks_admin_token=')) {
        return c.substring('attiks_admin_token='.length).trim();
      }
      if (c.startsWith('token=')) {
        return c.substring('token='.length).trim();
      }
    }
  }

  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return sendError(res, 'Authentication required. Please provide a valid Bearer token or session cookie.', 401);
  }

  const payload = verifyJwt(token);

  if (!payload) {
    return sendError(res, 'Invalid or expired token. Please log in again.', 401);
  }

  req.user = payload;
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Access forbidden: Insufficient permissions for this resource.', 403);
    }
    next();
  };
}
