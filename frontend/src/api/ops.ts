import { api } from "./client";

export type FsOp = { op: "mkdir" | "writeFile"; path: string; bytes?: number };

export interface PlanOperation {
  op: "mkdir" | "writeFile";
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

export interface CleanupItem {
  type: "emptyDir" | "largeFile" | "duplicate" | "cacheDir";
  path: string;
  size: number;
  reason: string;
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

export interface FileItem {
  path: string;
  name: string;
  type: 'file' | 'dir';
  classification?: {
    category: string;
    confidence: number;
    source: string;
    language?: string;
    semanticType?: string;
    framework?: string;
  };
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

export interface ReorganizePlan {
  moves: Array<{
    from: string;
    to: string;
    reason: string;
  }>;
  creates: string[];
}

export async function previewTree(text: string, outputDir?: string) {
  const { data } = await api.post("/preview", { text, outputDir });
  return data as { outputDir: string; ops: FsOp[]; count: number };
}

export async function applyTree(text: string, outputDir?: string, overwriteFiles?: boolean, dryRun?: boolean) {
  const { data } = await api.post("/apply", { text, outputDir, overwriteFiles, dryRun });
  return data as { success: boolean; outputDir: string; created: number; plan?: PlanResult; dryRun?: boolean };
}

export async function aiGenerate(prompt: string, provider?: string, model?: string) {
  const { data } = await api.post("/ai/generate", { prompt, provider, model });
  return data as { text: string };
}

export async function planFromText(text: string, outputDir?: string) {
  const { data } = await api.post("/plan/text", { text, outputDir });
  return data as { plan: PlanResult };
}

export async function planFromPrompt(prompt: string, provider?: string, model?: string, outputDir?: string) {
  const { data } = await api.post("/plan/prompt", { prompt, provider, model, outputDir });
  return data as { plan: PlanResult; text: string };
}

export async function scanCleanup(root?: string, options?: {
  includeEmptyDirs?: boolean;
  includeLargeFiles?: boolean;
  includeDuplicates?: boolean;
  includeCaches?: boolean;
  maxFileSizeMB?: number;
  hashDuplicates?: boolean;
  maxDepth?: number;
  excludeNames?: string[];
  followSymlinks?: boolean;
  duplicateStrategy?: 'size' | 'hash' | 'nameSize';
}) {
  const { data } = await api.post("/cleanup/scan", { root, ...options });
  return data as { plan: CleanupPlan };
}

export async function applyCleanup(plan: CleanupPlan, paths?: string[]) {
  const { data } = await api.post("/cleanup/apply", { plan, paths });
  return data as { deleted: number; freedBytes: number };
}

export async function analyzeDirectory(root?: string, maxDepth?: number, classify?: boolean, excludeNames?: string[]) {
  const { data } = await api.post("/organize/analyze", { root, maxDepth, classify, excludeNames });
  return data as { analysis: OrganizeResult };
}

export async function planReorganize(root?: string, maxDepth?: number, excludeNames?: string[], groupBy?: 'semantic' | 'language' | 'framework') {
  const { data } = await api.post("/organize/plan", { root, maxDepth, excludeNames, groupBy });
  return data as { plan: ReorganizePlan; analysis: OrganizeResult };
}

export async function applyReorganize(plan: ReorganizePlan) {
  const { data } = await api.post("/organize/apply", { plan });
  return data as { moved: number; created: number };
}
