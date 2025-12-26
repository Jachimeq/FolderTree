import { Router, Response } from 'express';
import { RequestWithUser } from '../middleware';
import { jwtAuth } from '../middleware/auth';
import logger from '../config/logger';
import { getUserProjects, createProject, getProjectById, updateProject, deleteProject } from '../services/projectService';
import { validateString } from '../utils/validators';
import { NotFoundError } from '../utils/errors';

const router = Router();

/**
 * Get user projects
 */
router.get('/', jwtAuth, async (req: RequestWithUser, res: Response) => {
  try {
    if (!req.user?.id) throw new Error('User not authenticated');
    
    const projects = await getUserProjects(req.user.id);

    res.json({
      success: true,
      data: projects,
    });
  } catch (error: any) {
    logger.error('Get projects error', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Create project
 */
router.post('/', jwtAuth, async (req: RequestWithUser, res: Response) => {
  try {
    if (!req.user?.id) throw new Error('User not authenticated');
    
    const { name, description, tree } = req.body;
    const name_validated = validateString(name, 'name', 1, 255);

    const project = await createProject(req.user.id, name_validated, description, tree);

    logger.info('Project created', {
      userId: req.user.id,
      projectId: project.id,
      name,
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    logger.error('Create project error', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get project by ID
 */
router.get('/:projectId', jwtAuth, async (req: RequestWithUser, res: Response) => {
  try {
    if (!req.user?.id) throw new Error('User not authenticated');
    
    const { projectId } = req.params;
    const project = await getProjectById(projectId, req.user.id);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

/**
 * Update project
 */
router.put('/:projectId', jwtAuth, async (req: RequestWithUser, res: Response) => {
  try {
    if (!req.user?.id) throw new Error('User not authenticated');
    
    const { projectId } = req.params;
    const { name, description, tree } = req.body;

    const project = await updateProject(projectId, req.user.id, { name, description, tree });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    logger.info('Project updated', { projectId, userId: req.user.id });

    res.json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

/**
 * Delete project
 */
router.delete('/:projectId', jwtAuth, async (req: RequestWithUser, res: Response) => {
  try {
    if (!req.user?.id) throw new Error('User not authenticated');
    
    const { projectId } = req.params;
    const success = await deleteProject(projectId, req.user.id);

    if (!success) {
      throw new NotFoundError('Project not found');
    }

    logger.info('Project deleted', { projectId, userId: req.user.id });

    res.json({
      success: true,
      data: {
        message: 'Project deleted',
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

export default router;
