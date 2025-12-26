import path from 'path';
import { ValidationError } from './errors';

export function validateString(value: any, fieldName: string, minLength = 1, maxLength = 10000): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }
  if (value.trim().length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} characters`);
  }
  if (value.length > maxLength) {
    throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`);
  }
  return value.trim();
}

export function validateEmail(email: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
  return email.toLowerCase();
}

export function validatePassword(password: string): string {
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    throw new ValidationError('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    throw new ValidationError('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    throw new ValidationError('Password must contain at least one number');
  }
  return password;
}

export function validatePath(inputPath: string, allowedBase?: string): string {
  if (typeof inputPath !== 'string') {
    throw new ValidationError('Path must be a string');
  }

  // Prevent directory traversal
  if (inputPath.includes('..') || inputPath.includes('~')) {
    throw new ValidationError('Invalid path: directory traversal not allowed');
  }

  const normalized = path.normalize(inputPath);
  const resolved = path.resolve(normalized);

  if (allowedBase) {
    const resolvedBase = path.resolve(allowedBase);
    if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) {
      throw new ValidationError(`Path outside allowed base directory`);
    }
  }

  return resolved;
}

export function validateTree(tree: any): void {
  if (!tree || typeof tree !== 'object') {
    throw new ValidationError('Tree must be an object');
  }
  if (!tree.items || typeof tree.items !== 'object') {
    throw new ValidationError('Tree must have items object');
  }
  if (!tree.rootId || typeof tree.rootId !== 'string') {
    throw new ValidationError('Tree must have rootId string');
  }
}

export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '')
    .replace(/[\r\n]/g, ' ')
    .trim();
}
