import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ValidationError } from '../utils/errors';
import { validatePathExists } from '../utils/pathSecurity';

export type CleanupItemType = 'emptyDir' | 'largeFile' | 'duplicate' | 'cacheDir';

export interface CleanupItem {
  type: CleanupItemType;
  path: string;
  size: number;
  reason: string;
}

export interface CleanupOptions {
  includeEmptyDirs?: boolean;
  includeLargeFiles?: boolean;
  includeDuplicates?: boolean;
  includeCaches?: boolean;
  maxFileSizeMB?: number;
  hashDuplicates?: boolean;
  cacheDirNames?: string[];
  maxDepth?: number;
  excludeNames?: string[];
  followSymlinks?: boolean;
  duplicateStrategy?: 'size' | 'hash' | 'nameSize';
}

export interface CleanupPlan {
  root: string;
  items: CleanupItem[];
  summary: {
    emptyDirs: number;
    largeFiles: number;
    duplicates: number;
    cacheDirs: number;
    estimatedBytes: number;
  };
}

const DEFAULT_CACHE_DIRS = ['node_modules', '.cache', 'dist', 'build', '.next', '.turbo', '.parcel-cache', '.pytest_cache'];
const DEFAULT_LARGE_MB = 50;
const MAX_HASH_BYTES = 20 * 1024 * 1024; // hash files up to 20MB to confirm duplicates

function getDirSize(targetPath: string): number {
  let size = 0;
  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      size += getDirSize(full);
    } else {
      const stats = fs.statSync(full);
      size += stats.size;
    }
  }
  return size;
}

function hashFile(targetPath: string): string {
  const buffer = fs.readFileSync(targetPath);
  return crypto.createHash('md5').update(buffer).digest('hex');
}

interface WalkResult {
  items: CleanupItem[];
  childCount: number;
}

function walkDir(root: string, options: CleanupOptions, duplicatesBucket: Map<number, string[]>, depth = 0): WalkResult {
  const items: CleanupItem[] = [];
  let childCount = 0;

  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (options.excludeNames && options.excludeNames.includes(entry.name)) {
      continue;
    }

    if (typeof entry.isSymbolicLink === 'function' && entry.isSymbolicLink()) {
      if (!options.followSymlinks) {
        continue;
      }
    }
    if (entry.isDirectory()) {
      if (options.maxDepth !== undefined && depth >= (options.maxDepth || 0)) {
        childCount += 1;
        continue;
      }
      // Handle cache dirs directly and skip deep walk for them
      if (options.includeCaches && (options.cacheDirNames || DEFAULT_CACHE_DIRS).includes(entry.name)) {
        const size = getDirSize(full);
        items.push({ type: 'cacheDir', path: full, size, reason: 'cache directory' });
        childCount += 1;
        continue;
      }

      const result = walkDir(full, options, duplicatesBucket, depth + 1);
      items.push(...result.items);
      childCount += 1;

      if (options.includeEmptyDirs && result.childCount === 0) {
        items.push({ type: 'emptyDir', path: full, size: 0, reason: 'empty directory' });
      }
    } else if (entry.isFile()) {
      const stats = fs.statSync(full);
      const size = stats.size;
      childCount += 1;

      if (options.includeLargeFiles && size >= (options.maxFileSizeMB || DEFAULT_LARGE_MB) * 1024 * 1024) {
        items.push({ type: 'largeFile', path: full, size, reason: 'exceeds size threshold' });
      }

      if (options.includeDuplicates) {
        const list = duplicatesBucket.get(size) || [];
        list.push(full);
        duplicatesBucket.set(size, list);
      }
    }
  }

  return { items, childCount };
}

function computeDuplicates(duplicatesBucket: Map<number, string[]>, strategy: 'size' | 'hash' | 'nameSize'): CleanupItem[] {
  const items: CleanupItem[] = [];

  duplicatesBucket.forEach(paths => {
    if (paths.length < 2) return;

    if (strategy === 'size') {
      // size-only grouping
      paths.slice(1).forEach(p => items.push({ type: 'duplicate', path: p, size: fs.statSync(p).size, reason: 'same file size group' }));
      return;
    }

    if (strategy === 'nameSize') {
      const groups = new Map<string, string[]>();
      for (const p of paths) {
        const key = `${path.basename(p)}:${fs.statSync(p).size}`;
        groups.set(key, [...(groups.get(key) || []), p]);
      }
      groups.forEach((hp) => {
        if (hp.length < 2) return;
        hp.slice(1).forEach(p => items.push({ type: 'duplicate', path: p, size: fs.statSync(p).size, reason: 'same name and size' }));
      });
      return;
    }

    // hash confirm
    const hashes = new Map<string, string[]>();
    for (const p of paths) {
      const size = fs.statSync(p).size;
      if (size > MAX_HASH_BYTES) {
        // skip hashing huge files; rely on size grouping
        hashes.set(`size:${size}`, [...(hashes.get(`size:${size}`) || []), p]);
        continue;
      }
      const hash = hashFile(p);
      hashes.set(hash, [...(hashes.get(hash) || []), p]);
    }

    hashes.forEach((hp, key) => {
      if (hp.length < 2) return;
      const reason = key.startsWith('size:') ? 'same file size group' : 'hash match';
      hp.slice(1).forEach(p => items.push({ type: 'duplicate', path: p, size: fs.statSync(p).size, reason }));
    });
  });

  return items;
}

export function scanCleanup(root: string, options: CleanupOptions = {}): CleanupPlan {
  if (!root) throw new ValidationError('root is required', 'ROOT_REQUIRED');
  validatePathExists(root, 'dir');

  const duplicatesBucket = new Map<number, string[]>();
  const walked = walkDir(root, options, duplicatesBucket, 0);
  const strategy: 'size' | 'hash' | 'nameSize' = options.duplicateStrategy || (options.hashDuplicates ? 'hash' : 'size');
  const duplicateItems = options.includeDuplicates ? computeDuplicates(duplicatesBucket, strategy) : [];

  const items = [...walked.items, ...duplicateItems];
  const summary = items.reduce(
    (acc, item) => {
      if (item.type === 'emptyDir') acc.emptyDirs += 1;
      if (item.type === 'largeFile') acc.largeFiles += 1;
      if (item.type === 'duplicate') acc.duplicates += 1;
      if (item.type === 'cacheDir') acc.cacheDirs += 1;
      acc.estimatedBytes += item.size;
      return acc;
    },
    { emptyDirs: 0, largeFiles: 0, duplicates: 0, cacheDirs: 0, estimatedBytes: 0 }
  );

  return {
    root,
    items,
    summary,
  };
}

export function applyCleanup(plan: CleanupPlan, selection?: string[]): { deleted: number; freedBytes: number } {
  if (!plan) throw new ValidationError('plan is required', 'PLAN_REQUIRED');

  const selected = selection && selection.length > 0
    ? plan.items.filter(item => selection.includes(item.path))
    : plan.items;

  // Delete files first, then directories deepest-first
  const files = selected.filter(i => i.type !== 'emptyDir' && i.type !== 'cacheDir');
  const dirs = selected.filter(i => i.type === 'emptyDir' || i.type === 'cacheDir')
    .sort((a, b) => b.path.split(path.sep).length - a.path.split(path.sep).length);

  let deleted = 0;
  let freedBytes = 0;

  for (const f of files) {
    if (fs.existsSync(f.path) && fs.statSync(f.path).isFile()) {
      fs.unlinkSync(f.path);
      deleted += 1;
      freedBytes += f.size;
    }
  }

  for (const d of dirs) {
    if (fs.existsSync(d.path) && fs.statSync(d.path).isDirectory()) {
      fs.rmSync(d.path, { recursive: true, force: true });
      deleted += 1;
      freedBytes += d.size;
    }
  }

  return { deleted, freedBytes };
}
