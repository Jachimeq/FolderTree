import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { config } from '../config/env';
import { UnauthorizedError } from '../utils/errors';

export interface TokenPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(userId: string, email: string): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = { id: userId, email };
  const secret = config.JWT_SECRET || 'default-dev-secret-change-in-production';
  return jwt.sign(payload, secret, {
    expiresIn: config.JWT_EXPIRES_IN || '7d',
  } as any);
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const secret = config.JWT_SECRET || 'default-dev-secret-change-in-production';
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string {
  if (!authHeader) {
    throw new UnauthorizedError('Missing authorization header');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    throw new UnauthorizedError('Invalid authorization header format');
  }

  return parts[1];
}
