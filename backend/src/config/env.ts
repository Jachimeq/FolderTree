import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import logger from './logger';

// Load .env from api.env or .env
const apiEnvPath = path.join(__dirname, '../../api.env');
if (fs.existsSync(apiEnvPath)) {
  dotenv.config({ path: apiEnvPath });
} else {
  dotenv.config();
}

export interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  API_KEY?: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  JWT_SECRET?: string;
  JWT_EXPIRES_IN: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL: string;
  OLLAMA_URL: string;
  OLLAMA_MODEL: string;
  AI_PROVIDER: 'openai' | 'ollama';
  DEFAULT_OUTPUT_DIR: string;
  ALLOWED_OUTPUT_BASE?: string;
  REDIS_URL: string;
  LOG_LEVEL: string;
  LOG_DIR: string;
}

function getEnvConfig(): EnvConfig {
  const errors: string[] = [];

  const PORT = parseInt(process.env.PORT || '3001', 10);
  if (isNaN(PORT)) errors.push('PORT must be a valid number');

  const NODE_ENV = (process.env.NODE_ENV || 'development') as any;
  if (!['development', 'production', 'test'].includes(NODE_ENV)) {
    errors.push('NODE_ENV must be one of: development, production, test');
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  if (NODE_ENV === 'production' && !DATABASE_URL) {
    errors.push('DATABASE_URL is required in production');
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret-change-in-production';

  if (errors.length > 0) {
    logger.error('Environment validation failed:', { errors });
    throw new Error(`Invalid environment configuration:\n${errors.join('\n')}`);
  }

  return {
    PORT,
    NODE_ENV,
    DATABASE_URL: DATABASE_URL || 'postgresql://localhost:5432/foldertree',
    API_KEY: process.env.API_KEY,
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434/api/generate',
    OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'mistral',
    AI_PROVIDER: (process.env.AI_PROVIDER || 'ollama') as any,
    DEFAULT_OUTPUT_DIR: process.env.DEFAULT_OUTPUT_DIR || './generated',
    ALLOWED_OUTPUT_BASE: process.env.ALLOWED_OUTPUT_BASE,
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_DIR: process.env.LOG_DIR || './logs',
  };
}

export const config = getEnvConfig();

logger.info('Environment loaded', {
  NODE_ENV: config.NODE_ENV,
  PORT: config.PORT,
  AI_PROVIDER: config.AI_PROVIDER,
});
