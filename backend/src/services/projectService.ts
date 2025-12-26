import { query } from '../config/database';
import logger from '../config/logger';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  tree: any;
  created_at: string;
  updated_at: string;
}

/**
 * Get user projects
 */
export async function getUserProjects(userId: string): Promise<Project[]> {
  try {
    const rows = await query(
      `SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId]
    );
    return rows;
  } catch (error) {
    logger.error('Get user projects error', { userId, error: (error as any).message });
    throw error;
  }
}

/**
 * Get project by ID
 */
export async function getProjectById(projectId: string, userId: string): Promise<Project | null> {
  try {
    const rows = await query(
      `SELECT * FROM projects WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [projectId, userId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logger.error('Get project error', { projectId, error: (error as any).message });
    throw error;
  }
}

/**
 * Create project
 */
export async function createProject(
  userId: string,
  name: string,
  description?: string,
  tree?: any
): Promise<Project> {
  try {
    const id = `project-${Date.now()}`;
    const now = new Date().toISOString();

    const rows = await query(
      `INSERT INTO projects (id, user_id, name, description, tree, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, userId, name, description || '', tree || {}, now, now]
    );

    logger.info('Project created', { projectId: id, userId, name });
    return rows[0];
  } catch (error) {
    logger.error('Create project error', { userId, name, error: (error as any).message });
    throw error;
  }
}

/**
 * Update project
 */
export async function updateProject(
  projectId: string,
  userId: string,
  updates: { name?: string; description?: string; tree?: any }
): Promise<Project | null> {
  try {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.tree !== undefined) {
      updateFields.push(`tree = $${paramCount++}`);
      values.push(JSON.stringify(updates.tree));
    }

    if (updateFields.length === 0) return getProjectById(projectId, userId);

    updateFields.push(`updated_at = $${paramCount++}`);
    values.push(new Date().toISOString());
    values.push(projectId);
    values.push(userId);

    const rows = await query(
      `UPDATE projects SET ${updateFields.join(', ')} WHERE id = $${paramCount - 1} AND user_id = $${paramCount} RETURNING *`,
      values
    );

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logger.error('Update project error', { projectId, error: (error as any).message });
    throw error;
  }
}

/**
 * Delete project
 */
export async function deleteProject(projectId: string, userId: string): Promise<boolean> {
  try {
    await query(
      `DELETE FROM projects WHERE id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    logger.info('Project deleted', { projectId, userId });
    return true;
  } catch (error) {
    logger.error('Delete project error', { projectId, error: (error as any).message });
    throw error;
  }
}

/**
 * Save project version
 */
export async function saveProjectVersion(
  projectId: string,
  tree: any,
  versionNumber?: number
): Promise<any> {
  try {
    const version = versionNumber || 1;
    const rows = await query(
      `INSERT INTO project_versions (project_id, version_number, tree, created_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [projectId, version, JSON.stringify(tree), new Date().toISOString()]
    );

    logger.info('Project version saved', { projectId, version });
    return rows[0];
  } catch (error) {
    logger.error('Save version error', { projectId, error: (error as any).message });
    throw error;
  }
}

/**
 * Get project versions
 */
export async function getProjectVersions(projectId: string): Promise<any[]> {
  try {
    const rows = await query(
      `SELECT * FROM project_versions WHERE project_id = $1 ORDER BY version_number DESC`,
      [projectId]
    );
    return rows;
  } catch (error) {
    logger.error('Get versions error', { projectId, error: (error as any).message });
    throw error;
  }
}
