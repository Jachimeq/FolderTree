import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { AppError } from '../utils/errors';

export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Error handling middleware - must be registered last
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  logger.error('Error caught by handler', {
    error: err.message,
    code: err.code,
    statusCode: err.statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  // Unknown error
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
    });
  });

  next();
}

/**
 * Optional API key authentication
 */
export function apiKeyAuth(req: RequestWithUser, res: Response, next: NextFunction) {
  const requiredKey = process.env.API_KEY;
  
  // If no API_KEY is configured, skip check
  if (!requiredKey) {
    return next();
  }

  const providedKey = req.headers['x-api-key'] as string;
  
  if (providedKey !== requiredKey) {
    logger.warn('Invalid API key attempt', {
      path: req.path,
      ip: req.ip || 'unknown',
    });
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      code: 'INVALID_API_KEY',
    });
  }

  next();
}

/**
 * Rate limiting - basic in-memory implementation (use redis-rate-limit in production)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): any {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
  
  const key = req.ip || 'unknown';
  const now = Date.now();
  
  let record = requestCounts.get(key);
  
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + windowMs };
    requestCounts.set(key, record);
  }

  record.count++;

  if (record.count > maxRequests) {
    logger.warn('Rate limit exceeded', {
      ip: key,
      count: record.count,
      maxRequests,
    });
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }

  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', maxRequests - record.count);
  res.setHeader('X-RateLimit-Reset', record.resetTime);

  return next();
}
