import path from 'path';
import fs from 'fs';
import { isLikelyFile } from '../utils/pathSecurity';
import { ValidationError } from '../utils/errors';

export interface FsOp {
  op: 'mkdir' | 'writeFile';
  path: string;
  bytes?: number;
  content?: string;
}

export interface PlanOperation {
  op: 'mkdir' | 'writeFile';
  path: string;
  exists: boolean;
  willOverwrite: boolean;
  bytes: number;
}

export interface PlanResult {
  outputDir: string;
  operations: PlanOperation[];
  stats: {
    total: number;
    dirs: number;
    files: number;
    overwriteCount: number;
    estimatedBytes: number;
  };
  rollback: {
    deletePaths: string[];
    note: string;
  };
}

export interface TreeNode {
  name: string;
  type: 'file' | 'dir';
  children: TreeNode[];
  content?: string;
}

/**
 * Normalize tree text: handle tabs, markdown lists, empty lines
 */
export function normalizeTreeText(text: string): string[] {
  const lines = (text || '')
    .replace(/\t/g, '  ') // tabs to spaces
    .split(/\r?\n/)
    .map(l => l.replace(/\s+$/g, '')) // trim trailing
    .filter(l => l.trim().length > 0); // remove empty

  // Convert markdown "- " format to indentation
  const isMarkdown = lines.some(l => /^\s*-\s+/.test(l));
  if (isMarkdown) {
    return lines.map(l => {
      const m = l.match(/^(\s*)-\s+(.*)$/);
      if (!m) return l;
      const leadingSpaces = m[1].length;
      const depth = Math.floor(leadingSpaces / 2);
      return '  '.repeat(depth) + m[2];
    });
  }

  return lines;
}

/**
 * Parse indentation-based tree into hierarchy
 */
export function parseTreeStructure(lines: string[]): TreeNode {
  const root: TreeNode = {
    name: '__root__',
    type: 'dir',
    children: [],
  };

  const stack: { indent: number; node: TreeNode }[] = [{ indent: -1, node: root }];

  for (const line of lines) {
    const indentMatch = line.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0].length : 0;
    const name = line.trim();

    if (!name) continue;

    const level = Math.floor(indent / 2);
    const type = isLikelyFile(name) ? 'file' : 'dir';

    // Pop stack until we find appropriate parent
    while (stack.length > 1 && stack[stack.length - 1].indent >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].node;
    const node: TreeNode = { name, type, children: [] };
    parent.children.push(node);
    stack.push({ indent: level, node });
  }

  return root;
}

/**
 * Convert tree structure to flat list of file operations
 */
export function treeToOperations(node: TreeNode, basePath: string): FsOp[] {
  const ops: FsOp[] = [];

  function walk(currentNode: TreeNode, currentPath: string) {
    for (const child of currentNode.children) {
      const childPath = path.join(currentPath, child.name);

      if (child.type === 'dir') {
        ops.push({ op: 'mkdir', path: childPath });
        walk(child, childPath);
      } else {
        ops.push({
          op: 'writeFile',
          path: childPath,
          bytes: 0,
          content: child.content || '',
        });
      }
    }
  }

  walk(node, basePath);
  return ops;
}

/**
 * Apply file operations to disk
 */
export function applyOperations(ops: FsOp[], options: { overwriteFiles?: boolean } = {}): number {
  let created = 0;

  for (const op of ops) {
    try {
      if (op.op === 'mkdir') {
        fs.mkdirSync(op.path, { recursive: true });
        created++;
      } else if (op.op === 'writeFile') {
        const dir = path.dirname(op.path);
        fs.mkdirSync(dir, { recursive: true });

        if (!options.overwriteFiles && fs.existsSync(op.path)) {
          continue;
        }

        fs.writeFileSync(op.path, op.content || '', 'utf-8');
        created++;
      }
    } catch (error) {
      throw new Error(`Failed to apply operation on ${op.path}: ${(error as any).message}`);
    }
  }

  return created;
}

/**
 * Generate tree from internal UI tree structure
 */
export interface InternalTreeNode {
  data: {
    title: string;
    content?: string;
  };
  children?: string[];
}

export interface InternalTree {
  items: Record<string, InternalTreeNode>;
  rootId: string;
}

export function internalTreeToOperations(tree: InternalTree, basePath: string): FsOp[] {
  const ops: FsOp[] = [];

  function walk(nodeId: string, currentPath: string) {
    const node = tree.items[nodeId];
    if (!node) return;

    const name = node.data.title;
    const childPath = path.join(currentPath, name);

    if (isLikelyFile(name)) {
      ops.push({
        op: 'writeFile',
        path: childPath,
        bytes: 0,
        content: node.data.content || '',
      });
    } else {
      ops.push({ op: 'mkdir', path: childPath });
      for (const childId of node.children || []) {
        walk(childId, childPath);
      }
    }
  }

  walk(tree.rootId, basePath);
  return ops;
}

/**
 * Build an execution plan with collision awareness and rollback hints
 */
export function buildPlanFromOps(ops: FsOp[], outputDir: string): PlanResult {
  const operations: PlanOperation[] = ops.map(op => {
    const exists = fs.existsSync(op.path);
    const willOverwrite = op.op === 'writeFile' && exists;
    const bytes = op.op === 'writeFile'
      ? op.bytes ?? (op.content ? Buffer.byteLength(op.content, 'utf-8') : 0)
      : 0;

    return {
      op: op.op,
      path: op.path,
      exists,
      willOverwrite,
      bytes,
    };
  });

  const stats = operations.reduce(
    (acc, op) => {
      acc.total += 1;
      if (op.op === 'mkdir') acc.dirs += 1;
      if (op.op === 'writeFile') {
        acc.files += 1;
        acc.estimatedBytes += op.bytes;
      }
      if (op.willOverwrite) acc.overwriteCount += 1;
      return acc;
    },
    { total: 0, dirs: 0, files: 0, overwriteCount: 0, estimatedBytes: 0 }
  );

  const rollbackDeletePaths = operations
    .filter(op => !op.exists)
    .map(op => op.path)
    // Sort deeper paths first to avoid dir-not-empty errors on rollback
    .sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);

  return {
    outputDir,
    operations,
    stats,
    rollback: {
      deletePaths: rollbackDeletePaths,
      note: 'Rollback deletes only newly created items. Overwritten files are not automatically restored.',
    },
  };
}

/**
 * Build plan from indented text tree
 */
export function buildPlanFromText(text: string, outputDir: string): PlanResult {
  if (!text || typeof text !== 'string') {
    throw new ValidationError('text must be provided to build plan', 'INVALID_TEXT');
  }

  const lines = normalizeTreeText(text);
  const tree = parseTreeStructure(lines);
  const ops = treeToOperations(tree, outputDir);
  return buildPlanFromOps(ops, outputDir);
}
