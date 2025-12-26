import { Router, Response } from 'express';
import { RequestWithUser } from '../middleware';
import { jwtAuth, optionalJwtAuth } from '../middleware/auth';
import logger from '../config/logger';
import { getAllTemplates, getTemplatesByCategory, createTemplate } from '../services/templateService';
import { validateString } from '../utils/validators';

const router = Router();

/**
 * Get all templates
 */
router.get('/', optionalJwtAuth, async (_req: RequestWithUser, res: Response) => {
  try {
    const templates = await getAllTemplates();

    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    logger.error('Get templates error', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get template by category
 */
router.get('/category/:category', optionalJwtAuth, async (req: RequestWithUser, res: Response) => {
  try {
    const { category } = req.params;
    const templates = await getTemplatesByCategory(category);
    
    res.json({
      success: true,
      data: {
        category,
        templates,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Create custom template (authenticated)
 */
router.post('/', jwtAuth, async (req: RequestWithUser, res: Response) => {
  try {
    const { name, category, tree, description } = req.body;
    
    const name_validated = validateString(name, 'name', 1, 255);
    const category_validated = validateString(category, 'category', 1, 100);

    const template = await createTemplate(name_validated, description || '', category_validated, tree || {}, req.user?.id);

    logger.info('Template created', {
      userId: req.user?.id,
      templateId: template.id,
      name,
      category,
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    logger.error('Create template error', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
