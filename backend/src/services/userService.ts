import { query, getClient } from '../config/database';
import { hashPassword, comparePasswords } from './authService';
import logger from '../config/logger';

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const rows = await query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logger.error('Find user by email error', { email, error: (error as any).message });
    throw error;
  }
}

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  try {
    const rows = await query(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logger.error('Find user by ID error', { id, error: (error as any).message });
    throw error;
  }
}

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<User> {
  const client = await getClient();
  try {
    const passwordHash = await hashPassword(password);
    const id = `user-${Date.now()}`;
    const now = new Date().toISOString();

    const rows = await client.query(
      `INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, email.toLowerCase(), name, passwordHash, now, now]
    );

    logger.info('User created', { userId: id, email });
    return rows.rows[0];
  } catch (error) {
    logger.error('Create user error', { email, error: (error as any).message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verify user password
 */
export async function verifyUserPassword(email: string, password: string): Promise<User | null> {
  try {
    const user = await findUserByEmail(email);
    if (!user) return null;

    const isValid = await comparePasswords(password, user.password_hash);
    return isValid ? user : null;
  } catch (error) {
    logger.error('Verify password error', { email, error: (error as any).message });
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  { name, email }: { name?: string; email?: string }
): Promise<User | null> {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email.toLowerCase());
    }

    if (updates.length === 0) return findUserById(userId);

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date().toISOString());
    values.push(userId);

    const rows = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logger.error('Update user profile error', { userId, error: (error as any).message });
    throw error;
  }
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const rows = await query('DELETE FROM users WHERE id = $1', [userId]);
    logger.info('User deleted', { userId });
    return rows.length > 0;
  } catch (error) {
    logger.error('Delete user error', { userId, error: (error as any).message });
    throw error;
  }
}
