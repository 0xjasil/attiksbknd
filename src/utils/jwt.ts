import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { AuthUserPayload } from '../types';

export function signJwt(payload: AuthUserPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyJwt(token: string): AuthUserPayload | null {
  try {
    return jwt.verify(token, ENV.JWT_SECRET) as AuthUserPayload;
  } catch {
    return null;
  }
}
