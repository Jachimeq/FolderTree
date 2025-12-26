import { Router, Response } from 'express';
import path from 'path';
import { RequestWithUser, apiKeyAuth, rateLimitMiddleware } from '../middleware';
import { validateString } from '../utils/validators';
import { config } from '../config/env';
import logger from '../config/logger';
import { analyzeDirectory, generateReorganizePlan, applyReorganizePlan } from '../services/organizerService';
import { validatePathExists, securePath } from '../utils/pathSecurity';
import { ApiResponse } from '../types';

const router = Router();

router.use(rateLimitMiddleware);
router.use(apiKeyAuth);

function resolveRoot(rawRoot?: string): string {
  const baseDir = rawRoot || config.DEFAULT_OUTPUT_DIR || process.cwd();
  const resolved = config.ALLOWED_OUTPUT_BASE
    ? securePath(baseDir, config.ALLOWED_OUTPUT_BASE)
    : path.resolve(baseDir);
  validatePathExists(resolved, 'dir');
  return resolved;
}

router.post('/analyze', async (req: RequestWithUser, res: Response<ApiResponse>) => {
  try {
    const { root, maxDepth, classify } = req.body || {};

    if (root) {
      validateString(root, 'root', 1, 500);
    }

    const resolvedRoot = resolveRoot(root);

    const analysis = await analyzeDirectory(resolvedRoot, {
      maxDepth: maxDepth || 3,
      classify: classify !== false,
    });

    logger.info('Directory analysis completed', {
      root: resolvedRoot,
      stats: analysis.stats,
    });

    res.json({
      success: true,
      data: { analysis },
    });
  } catch (error: any) {
    logger.error('Organize analyze error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

router.post('/plan', async (req: RequestWithUser, res: Response<ApiResponse>) => {
  try {
    const { root, maxDepth, excludeNames, groupBy } = req.body || {};

    if (root) {
      validateString(root, 'root', 1, 500);
    }

    const resolvedRoot = resolveRoot(root);

    const analysis = await analyzeDirectory(resolvedRoot, {
      maxDepth: maxDepth || 3,
      classify: true,
      excludeNames: Array.isArray(excludeNames) ? excludeNames : [],
    });

    const plan = generateReorganizePlan(analysis, (groupBy as any) || 'semantic');

    logger.info('Reorganize plan generated', {
      root: resolvedRoot,
      movesCount: plan.moves.length,
      createsCount: plan.creates.length,
    });

    res.json({
      success: true,
      data: { plan, analysis },
    });
  } catch (error: any) {
    logger.error('Organize plan error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

router.post('/apply', (req: RequestWithUser, res: Response<ApiResponse>) => {
  try {
    const { plan } = req.body;

    if (!plan || typeof plan !== 'object') {
      throw new Error('plan is required to apply reorganization');
    }

    const result = applyReorganizePlan(plan);

    logger.info('Reorganization applied', {
      moved: result.moved,
      created: result.created,
    });

    res.json({
      success: true,
      data: {
        moved: result.moved,
        created: result.created,
      },
    });
  } catch (error: any) {
    logger.error('Organize apply error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

export default router;
