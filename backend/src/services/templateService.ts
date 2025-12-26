import { query } from '../config/database';
import logger from '../config/logger';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tree: any;
  rating: number;
  downloads: number;
  created_at: string;
  created_by?: string;
}

/**
 * Get all templates
 */
export async function getAllTemplates(): Promise<Template[]> {
  try {
    const rows = await query(
      `SELECT * FROM templates ORDER BY rating DESC, downloads DESC LIMIT 50`
    );
    return rows;
  } catch (error) {
    logger.error('Get all templates error', { error: (error as any).message });
    throw error;
  }
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategory(category: string): Promise<Template[]> {
  try {
    const rows = await query(
      `SELECT * FROM templates WHERE category = $1 ORDER BY rating DESC LIMIT 50`,
      [category]
    );
    return rows;
  } catch (error) {
    logger.error('Get templates by category error', { category, error: (error as any).message });
    throw error;
  }
}

/**
 * Get template by ID
 */
export async function getTemplateById(templateId: string): Promise<Template | null> {
  try {
    const rows = await query(
      `SELECT * FROM templates WHERE id = $1 LIMIT 1`,
      [templateId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logger.error('Get template error', { templateId, error: (error as any).message });
    throw error;
  }
}

/**
 * Create template
 */
export async function createTemplate(
  name: string,
  description: string,
  category: string,
  tree: any,
  createdBy?: string
): Promise<Template> {
  try {
    const id = `template-${Date.now()}`;
    const now = new Date().toISOString();

    const rows = await query(
      `INSERT INTO templates (id, name, description, category, tree, rating, downloads, created_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, name, description, category, JSON.stringify(tree), 0, 0, now, createdBy]
    );

    logger.info('Template created', { templateId: id, name, category });
    return rows[0];
  } catch (error) {
    logger.error('Create template error', { name, error: (error as any).message });
    throw error;
  }
}

/**
 * Increment template downloads
 */
export async function incrementDownloads(templateId: string): Promise<void> {
  try {
    await query(
      `UPDATE templates SET downloads = downloads + 1 WHERE id = $1`,
      [templateId]
    );
  } catch (error) {
    logger.error('Increment downloads error', { templateId, error: (error as any).message });
  }
}

/**
 * Update template rating
 */
export async function updateTemplateRating(templateId: string, rating: number): Promise<void> {
  try {
    await query(
      `UPDATE templates SET rating = $1 WHERE id = $2`,
      [rating, templateId]
    );
  } catch (error) {
    logger.error('Update rating error', { templateId, error: (error as any).message });
  }
}

/**
 * Add user favorite
 */
export async function addUserFavorite(userId: string, templateId: string): Promise<void> {
  try {
    await query(
      `INSERT INTO user_favorites (user_id, template_id, created_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, template_id) DO NOTHING`,
      [userId, templateId, new Date().toISOString()]
    );

    logger.info('Favorite added', { userId, templateId });
  } catch (error) {
    logger.error('Add favorite error', { userId, templateId, error: (error as any).message });
  }
}

/**
 * Get user favorites
 */
export async function getUserFavorites(userId: string): Promise<Template[]> {
  try {
    const rows = await query(
      `SELECT t.* FROM templates t
       JOIN user_favorites uf ON t.id = uf.template_id
       WHERE uf.user_id = $1
       ORDER BY uf.created_at DESC`,
      [userId]
    );
    return rows;
  } catch (error) {
    logger.error('Get favorites error', { userId, error: (error as any).message });
    throw error;
  }
}

/**
 * Remove favorite
 */
export async function removeUserFavorite(userId: string, templateId: string): Promise<void> {
  try {
    await query(
      `DELETE FROM user_favorites WHERE user_id = $1 AND template_id = $2`,
      [userId, templateId]
    );
    logger.info('Favorite removed', { userId, templateId });
  } catch (error) {
    logger.error('Remove favorite error', { userId, templateId, error: (error as any).message });
  }
}
