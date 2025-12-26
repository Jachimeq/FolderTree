import fs from 'fs';
import path from 'path';
import { ValidationError } from '../utils/errors';
import { validatePathExists } from '../utils/pathSecurity';
import { classifyItem, ClassifyResult } from './classifierService';

export interface FileItem {
  path: string;
  name: string;
  type: 'file' | 'dir';
  classification?: ClassifyResult;
  size?: number;
}

export interface OrganizeResult {
  root: string;
  items: FileItem[];
  suggestions: {
    [semanticType: string]: FileItem[];
  };
  stats: {
    totalFiles: number;
    totalDirs: number;
    languages: Record<string, number>;
    semanticTypes: Record<string, number>;
  };
}

function walkDirectory(rootPath: string, maxDepth = 3, currentDepth = 0, excludeNames: string[] = []): FileItem[] {
  if (currentDepth >= maxDepth) return [];

  const items: FileItem[] = [];
  const entries = fs.readdirSync(rootPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(rootPath, entry.name);

    // Skip node_modules, .git, etc
    if (['.git', 'node_modules', '.venv', '__pycache__', 'dist', 'build'].includes(entry.name) || excludeNames.includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      items.push({
        path: fullPath,
        name: entry.name,
        type: 'dir',
      });

      // Recurse into subdirectories
      items.push(...walkDirectory(fullPath, maxDepth, currentDepth + 1, excludeNames));
    } else if (entry.isFile()) {
      const stats = fs.statSync(fullPath);
      items.push({
        path: fullPath,
        name: entry.name,
        type: 'file',
        size: stats.size,
      });
    }
  }

  return items;
}

export async function analyzeDirectory(rootPath: string, options: { maxDepth?: number; classify?: boolean; excludeNames?: string[] } = {}): Promise<OrganizeResult> {
  if (!rootPath) throw new ValidationError('rootPath is required', 'ROOT_REQUIRED');
  validatePathExists(rootPath, 'dir');

  const maxDepth = options.maxDepth || 3;
  const shouldClassify = options.classify !== false;

  const items = walkDirectory(rootPath, maxDepth, 0, options.excludeNames || []);

  // Classify items if requested
  if (shouldClassify) {
    for (const item of items) {
      try {
        item.classification = await classifyItem(item.name);
      } catch (error) {
        // Skip classification errors
      }
    }
  }

  // Generate suggestions based on semantic types
  const suggestions: Record<string, FileItem[]> = {};
  const languageStats: Record<string, number> = {};
  const semanticStats: Record<string, number> = {};

  let totalFiles = 0;
  let totalDirs = 0;

  for (const item of items) {
    if (item.type === 'file') totalFiles++;
    if (item.type === 'dir') totalDirs++;

    if (item.classification) {
      const { language, semanticType } = item.classification;

      if (language) {
        languageStats[language] = (languageStats[language] || 0) + 1;
      }

      if (semanticType) {
        semanticStats[semanticType] = (semanticStats[semanticType] || 0) + 1;
        if (!suggestions[semanticType]) {
          suggestions[semanticType] = [];
        }
        suggestions[semanticType].push(item);
      }
    }
  }

  return {
    root: rootPath,
    items,
    suggestions,
    stats: {
      totalFiles,
      totalDirs,
      languages: languageStats,
      semanticTypes: semanticStats,
    },
  };
}

export interface ReorganizePlan {
  moves: Array<{
    from: string;
    to: string;
    reason: string;
  }>;
  creates: string[];
}

export function generateReorganizePlan(analysis: OrganizeResult, groupBy: 'semantic' | 'language' | 'framework' = 'semantic'): ReorganizePlan {
  const moves: Array<{ from: string; to: string; reason: string }> = [];
  const creates = new Set<string>();

  const entries = Object.entries(analysis.suggestions);
  for (const [key, items] of entries) {
    const dirName = key || (groupBy === 'language' ? 'language' : groupBy === 'framework' ? 'framework' : 'misc');
    const targetDir = path.join(analysis.root, dirName);
    creates.add(targetDir);

    for (const item of items) {
      const targetPath = path.join(targetDir, item.name);
      if (item.path !== targetPath) {
        moves.push({
          from: item.path,
          to: targetPath,
          reason: `Move to ${dirName} category`,
        });
      }
    }
  }

  return {
    moves,
    creates: Array.from(creates),
  };
}

export function applyReorganizePlan(plan: ReorganizePlan): { moved: number; created: number } {
  let created = 0;
  let moved = 0;

  // Create directories first
  for (const dir of plan.creates) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      created++;
    }
  }

  // Move files
  for (const move of plan.moves) {
    if (fs.existsSync(move.from)) {
      fs.renameSync(move.from, move.to);
      moved++;
    }
  }

  return { moved, created };
}
