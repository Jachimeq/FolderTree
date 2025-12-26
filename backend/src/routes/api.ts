import { Router, Response } from 'express';
import { RequestWithUser, apiKeyAuth, rateLimitMiddleware } from '../middleware';
import { validateString, validateTree } from '../utils/validators';
import { securePath } from '../utils/pathSecurity';
import { config } from '../config/env';
import path from 'path';
import logger from '../config/logger';
import {
  normalizeTreeText,
  parseTreeStructure,
  treeToOperations,
  applyOperations,
  internalTreeToOperations,
  buildPlanFromOps,
  buildPlanFromText,
} from '../services/fileSystemService';
import { classifyItem } from '../services/classifierService';
import { generateStructure } from '../services/aiGeneratorService';
import { ApiResponse, CreateFoldersRequest, PreviewRequest } from '../types';

const router = Router();

// Apply middleware
router.use(rateLimitMiddleware);
router.use(apiKeyAuth);

/**
 * Health check endpoint
 */
router.get('/health', (_req: RequestWithUser, res: Response<ApiResponse>) => {
  res.json({
    success: true,
    data: {
      ok: true,
      name: 'FolderTreePRO Backend',
      time: new Date().toISOString(),
      version: '2.0.0',
    },
  });
});

/**
 * Create folders from drag-drop UI tree
 */
router.post('/create-folders', (req: RequestWithUser, res: Response<ApiResponse>) => {
  try {
    const body = req.body as Partial<CreateFoldersRequest>;

    // Normalize tree payload
    let tree = body.tree;
    if (!tree) {
      tree = body as any; // entire body might be tree
    }

    validateTree(tree);

    const baseDir = config.DEFAULT_OUTPUT_DIR || './generated';
    const outputDir = config.ALLOWED_OUTPUT_BASE
      ? securePath(baseDir, config.ALLOWED_OUTPUT_BASE)
      : path.resolve(baseDir);

    const ops = internalTreeToOperations((tree as any) || { items: [], rootId: '' }, outputDir);
    const created = applyOperations(ops, {
      overwriteFiles: body.overwriteFiles,
    });

    logger.info('Folders created from UI tree', {
      operationsCount: ops.length,
      itemsCreated: created,
      outputDir,
    });

    res.json({
      success: true,
      data: {
        success: true,
        output: outputDir,
        created,
      },
    });
  } catch (error: any) {
    logger.error('Create folders error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

/**
 * Preview tree structure from text
 */
router.post('/preview', (req: RequestWithUser, res: Response<ApiResponse>) => {
  try {
    const { text, outputDir: customOutputDir } = req.body as PreviewRequest;
    const text_validated = validateString(text, 'text', 1, 100000);

    const lines = normalizeTreeText(text_validated);
    const tree = parseTreeStructure(lines);

    const baseDir = customOutputDir || config.DEFAULT_OUTPUT_DIR || './generated';
    const outputDir = config.ALLOWED_OUTPUT_BASE
      ? securePath(baseDir, config.ALLOWED_OUTPUT_BASE)
      : path.resolve(baseDir);

    const ops = treeToOperations(tree, outputDir);

    logger.info('Preview generated', {
      linesCount: lines.length,
      operationsCount: ops.length,
    });

    res.json({
      success: true,
      data: {
        outputDir,
        ops,
        count: ops.length,
      },
    });
  } catch (error: any) {
    logger.error('Preview error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

/**
 * Apply tree structure (create files/folders)
 */
router.post('/apply', (req: RequestWithUser, res: Response<ApiResponse>) => {
  try {
    const { text, outputDir: customOutputDir, overwriteFiles, dryRun } = req.body;
    const text_validated = validateString(text, 'text', 1, 100000);

    const lines = normalizeTreeText(text_validated);
    const tree = parseTreeStructure(lines);

    const baseDir = customOutputDir || config.DEFAULT_OUTPUT_DIR || './generated';
    const outputDir = config.ALLOWED_OUTPUT_BASE
      ? securePath(baseDir, config.ALLOWED_OUTPUT_BASE)
      : path.resolve(baseDir);

    const ops = treeToOperations(tree, outputDir);
    const plan = buildPlanFromOps(ops, outputDir);

    if (dryRun) {
      logger.info('Tree structure dry-run plan generated', {
        operationsCount: plan.stats.total,
        overwriteCount: plan.stats.overwriteCount,
        outputDir,
      });

      res.json({
        success: true,
        data: {
          dryRun: true,
          plan,
        },
      });
      return;
    }

    const created = applyOperations(ops, { overwriteFiles });

    logger.info('Tree structure applied', {
      operationsCount: ops.length,
      itemsCreated: created,
      outputDir,
    });

    res.json({
      success: true,
      data: {
        success: true,
        outputDir,
        created,
        plan,
      },
    });
  } catch (error: any) {
    logger.error('Apply error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

/**
 * Plan (dry-run) tree creation from raw text
 */
router.post('/plan/text', (req: RequestWithUser, res: Response<ApiResponse>) => {
  try {
    const { text, outputDir: customOutputDir } = req.body;
    const text_validated = validateString(text, 'text', 1, 100000);

    const baseDir = customOutputDir || config.DEFAULT_OUTPUT_DIR || './generated';
    const outputDir = config.ALLOWED_OUTPUT_BASE
      ? securePath(baseDir, config.ALLOWED_OUTPUT_BASE)
      : path.resolve(baseDir);

    const plan = buildPlanFromText(text_validated, outputDir);

    res.json({
      success: true,
      data: {
        plan,
      },
    });
  } catch (error: any) {
    logger.error('Plan text error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

/**
 * Plan (dry-run) tree creation from AI prompt
 */
router.post('/plan/prompt', async (req: RequestWithUser, res: Response<ApiResponse>) => {
  try {
    const { prompt, provider, model, outputDir: customOutputDir } = req.body;
    const prompt_validated = validateString(prompt, 'prompt', 10, 5000);

    const text = await generateStructure({
      prompt: prompt_validated,
      provider,
      model,
    });

    const baseDir = customOutputDir || config.DEFAULT_OUTPUT_DIR || './generated';
    const outputDir = config.ALLOWED_OUTPUT_BASE
      ? securePath(baseDir, config.ALLOWED_OUTPUT_BASE)
      : path.resolve(baseDir);

    const plan = buildPlanFromText(text, outputDir);

    res.json({
      success: true,
      data: {
        plan,
        text,
      },
    });
  } catch (error: any) {
    logger.error('Plan prompt error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

/**
 * Classify file/folder name
 */
router.post('/classify', async (req: RequestWithUser, res: Response<ApiResponse>) => {
  try {
    const { title } = req.body;
    const title_validated = validateString(title, 'title', 1, 500);

    const result = await classifyItem(title_validated);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Classify error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

/**
 * Generate structure using AI
 */
router.post('/ai/generate', async (req: RequestWithUser, res: Response<ApiResponse>) => {
  try {
    const { prompt, provider, model } = req.body;
    const prompt_validated = validateString(prompt, 'prompt', 10, 5000);

    const text = await generateStructure({
      prompt: prompt_validated,
      provider,
      model,
    });

    logger.info('AI structure generated', {
      provider,
      promptLength: prompt_validated.length,
      outputLength: text.length,
    });

    res.json({
      success: true,
      data: { text },
    });
  } catch (error: any) {
    logger.error('AI generate error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

export default router;
