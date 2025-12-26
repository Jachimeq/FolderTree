export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateFoldersRequest {
  tree: FolderTree;
  overwriteFiles?: boolean;
  createFiles?: boolean;
}

export interface PreviewRequest {
  text: string;
  outputDir?: string;
}

export interface ApplyRequest {
  text: string;
  outputDir?: string;
  overwriteFiles?: boolean;
}

export interface AiGenerateRequest {
  prompt: string;
  provider?: 'openai' | 'ollama';
  model?: string;
}

export interface ClassifyRequest {
  title: string;
}

export interface ClassifyResponse {
  category: string;
  confidence: number;
  source: 'openai' | 'local' | 'ollama';
}

export interface FsOp {
  op: 'mkdir' | 'writeFile';
  path: string;
  bytes?: number;
  content?: string;
}

export interface FolderTree {
  items: Record<string, TreeNode>;
  rootId: string;
}

export interface TreeNode {
  data: {
    title: string;
    content?: string;
  };
  children: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  tree: FolderTree;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  version: number;
  tree: FolderTree;
  createdAt: Date;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tree: FolderTree;
  rating: number;
  downloads: number;
  author: string;
  createdAt: Date;
}
