import path from 'path';
import fs from 'fs';
import { ValidationError } from './errors';

/**
 * Normalize and validate a file path to prevent directory traversal attacks
 */
export function securePath(inputPath: string, baseDir?: string): string {
  // Normalize the path to handle . and ..
  const normalized = path.normalize(inputPath);

  // Check for directory traversal attempts
  if (normalized.includes('..') || normalized.startsWith('~')) {
    throw new ValidationError('Invalid path: directory traversal not allowed', 'PATH_TRAVERSAL');
  }

  // If baseDir provided, ensure resolved path is within it
  if (baseDir) {
    const resolvedBase = path.resolve(baseDir);
    const resolvedPath = path.resolve(baseDir, normalized);

    if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
      throw new ValidationError('Path is outside allowed directory', 'PATH_OUT_OF_BOUNDS');
    }

    return resolvedPath;
  }

  return path.resolve(normalized);
}

/**
 * Check if a path exists and is within expected type
 */
export function validatePathExists(filePath: string, expectedType: 'file' | 'dir' | 'any' = 'any'): void {
  if (!fs.existsSync(filePath)) {
    throw new ValidationError(`Path does not exist: ${filePath}`, 'PATH_NOT_FOUND');
  }

  const stats = fs.statSync(filePath);

  if (expectedType === 'file' && !stats.isFile()) {
    throw new ValidationError(`Expected file but got directory: ${filePath}`, 'INVALID_PATH_TYPE');
  }

  if (expectedType === 'dir' && !stats.isDirectory()) {
    throw new ValidationError(`Expected directory but got file: ${filePath}`, 'INVALID_PATH_TYPE');
  }
}

/**
 * Safe filesystem operation wrapper
 */
export function safeFileOp<T>(operation: () => T, context: string): T {
  try {
    return operation();
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError(`File operation failed [${context}]: ${(error as any).message}`, 'FILE_OP_ERROR');
  }
}

/**
 * Detect if a name looks like a file (has extension)
 */
export function isLikelyFile(name: string): boolean {
  return /\.[a-z0-9]+$/i.test(name);
}

/**
 * Sanitize filename to prevent injection
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"|?*]/g, '_') // Replace invalid characters
    .replace(/\s+/g, '_') // Replace whitespace
    .substring(0, 255); // Limit length
}
