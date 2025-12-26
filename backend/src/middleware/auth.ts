import { Response, NextFunction } from 'express';
import { RequestWithUser } from './index';
import { extractTokenFromHeader, verifyToken } from '../services/authService';
import logger from '../config/logger';
import { UnauthorizedError } from '../utils/errors';

/**
 * JWT authentication middleware
 */
export function jwtAuth(req: RequestWithUser, res: Response, next: NextFunction): any {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token);

    req.user = {
      id: payload.id,
      email: payload.email,
    };

    return next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return res.status(401).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED',
      });
    }

    logger.warn('JWT auth failed', { error: (error as any).message });
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      code: 'UNAUTHORIZED',
    });
  }
}

/**
 * Optional JWT auth - doesn't fail if token missing
 */
export function optionalJwtAuth(req: RequestWithUser, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token);

    req.user = {
      id: payload.id,
      email: payload.email,
    };
  } catch (error) {
    // Silently ignore auth errors in optional middleware
    logger.debug('Optional JWT auth skipped');
  }

  next();
}
