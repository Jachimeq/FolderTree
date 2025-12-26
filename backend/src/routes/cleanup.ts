import { Router, Response } from 'express';
import path from 'path';
import { RequestWithUser, apiKeyAuth, rateLimitMiddleware } from '../middleware';
import { validateString } from '../utils/validators';
import { config } from '../config/env';
import logger from '../config/logger';
import { scanCleanup, applyCleanup, CleanupPlan } from '../services/cleanupService';
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

router.post('/scan', (req: RequestWithUser, res: Response<ApiResponse>) => {
  try {
    const { root, includeEmptyDirs, includeLargeFiles, includeDuplicates, includeCaches, maxFileSizeMB, hashDuplicates, maxDepth, excludeNames, followSymlinks, duplicateStrategy } = req.body || {};

    if (root) {
      validateString(root, 'root', 1, 500);
    }

    const resolvedRoot = resolveRoot(root);

    const plan = scanCleanup(resolvedRoot, {
      includeEmptyDirs: includeEmptyDirs ?? true,
      includeLargeFiles: includeLargeFiles ?? true,
      includeDuplicates: includeDuplicates ?? true,
      includeCaches: includeCaches ?? true,
      maxFileSizeMB,
      hashDuplicates,
      maxDepth,
      excludeNames,
      followSymlinks,
      duplicateStrategy,
    });

    logger.info('Cleanup scan completed', {
      root: resolvedRoot,
      counts: plan.summary,
    });

    res.json({
      success: true,
      data: { plan },
    });
  } catch (error: any) {
    logger.error('Cleanup scan error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

router.post('/apply', (req: RequestWithUser, res: Response<ApiResponse>) => {
  try {
    const { plan, paths } = req.body as { plan?: CleanupPlan; paths?: string[] };

    if (!plan || typeof plan !== 'object') {
      throw new Error('plan is required to apply cleanup');
    }

    const resolvedRoot = resolveRoot(plan.root);
    if (path.resolve(plan.root) !== resolvedRoot) {
      throw new Error('plan root mismatch');
    }

    const selection = Array.isArray(paths) ? paths : undefined;
    const result = applyCleanup(plan, selection);

    logger.info('Cleanup apply completed', {
      root: resolvedRoot,
      deleted: result.deleted,
      freedBytes: result.freedBytes,
    });

    res.json({
      success: true,
      data: {
        deleted: result.deleted,
        freedBytes: result.freedBytes,
      },
    });
  } catch (error: any) {
    logger.error('Cleanup apply error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

export default router;
