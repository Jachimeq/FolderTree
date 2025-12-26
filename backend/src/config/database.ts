import { Pool, PoolClient } from 'pg';
import { config } from './env';
import logger from './logger';

/**
 * PostgreSQL connection pool
 */
const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err: Error) => {
  logger.error('Unexpected error on idle client', { error: err.message });
});

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connected', { timestamp: result.rows[0].now });
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error: (error as any).message });
    return false;
  }
}

/**
 * Execute a query
 */
export async function query(text: string, params?: any[]): Promise<any> {
  try {
    const result = await pool.query(text, params);
    return result.rows;
  } catch (error) {
    logger.error('Query error', { query: text, error: (error as any).message });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Close the pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool;
