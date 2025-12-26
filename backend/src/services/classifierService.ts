import axios from 'axios';
import OpenAI from 'openai';
import path from 'path';
import { config } from '../config/env';
import { ValidationError } from '../utils/errors';

const KEYWORDS: Record<string, string[]> = {
  Code: ['script', 'manager', 'controller', '.cs', '.js', '.ts', '.tsx', '.py', '.java', '.cpp', '.go', '.rs'],
  Graphics: ['button', 'logo', 'icon', 'sprite', 'canvas', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.psd', '.ai'],
  Audio: ['sound', 'music', '.mp3', '.wav', '.flac', '.ogg', '.m4a'],
  Video: ['.mp4', '.mov', '.mkv', '.avi', '.webm'],
  Documents: ['faktura', 'podatek', 'rachunek', 'umowa', '.pdf', '.doc', '.docx', '.txt', '.md', '.xlsx', '.csv'],
  Game: ['boss', 'arena', 'enemy', 'player', 'level', 'quest', 'weapon', 'shader', 'unity', 'unreal'],
  Archives: ['.zip', '.rar', '.7z', '.tar', '.gz'],
};

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.py': 'Python',
  '.java': 'Java',
  '.cpp': 'C++',
  '.c': 'C',
  '.cs': 'C#',
  '.go': 'Go',
  '.rs': 'Rust',
  '.php': 'PHP',
  '.rb': 'Ruby',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
  '.scala': 'Scala',
};

const SEMANTIC_TYPES = {
  code: ['src', 'lib', 'server', 'client', 'api', 'routes', 'controllers', 'models', 'views', 'components', 'utils', 'helpers', 'services'],
  tests: ['test', 'tests', '__tests__', 'spec', 'specs', 'e2e', 'integration', 'unit'],
  config: ['config', 'conf', 'settings', '.vscode', '.idea', '.git'],
  docs: ['docs', 'documentation', 'readme', 'changelog', 'license'],
  build: ['dist', 'build', 'out', 'target', 'release', 'bin', 'obj'],
  assets: ['assets', 'static', 'public', 'resources', 'images', 'fonts', 'styles', 'css'],
  data: ['data', 'db', 'database', 'migrations', 'seeds', 'fixtures'],
  logs: ['logs', 'log', '.log'],
  cache: ['cache', '.cache', 'tmp', 'temp', 'node_modules', '.venv', '__pycache__'],
};

export interface ClassifyResult {
  category: string;
  confidence: number;
  source: 'local' | 'openai' | 'ollama';
  language?: string;
  semanticType?: string;
  framework?: string;
}

/**
 * Detect programming language from file extension
 */
function detectLanguage(title: string): string | undefined {
  const ext = path.extname(title).toLowerCase();
  return LANGUAGE_EXTENSIONS[ext];
}

/**
 * Detect semantic type from path components
 */
function detectSemanticType(title: string): string | undefined {
  const titleLower = title.toLowerCase();
  for (const [type, keywords] of Object.entries(SEMANTIC_TYPES)) {
    if (keywords.some(keyword => titleLower.includes(keyword))) {
      return type;
    }
  }
  return undefined;
}

/**
 * Detect framework from common patterns
 */
function detectFramework(title: string): string | undefined {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('react') || titleLower.includes('.tsx')) return 'React';
  if (titleLower.includes('vue')) return 'Vue';
  if (titleLower.includes('angular')) return 'Angular';
  if (titleLower.includes('next')) return 'Next.js';
  if (titleLower.includes('express')) return 'Express';
  if (titleLower.includes('django')) return 'Django';
  if (titleLower.includes('flask')) return 'Flask';
  if (titleLower.includes('spring')) return 'Spring';
  return undefined;
}

/**
 * Local classification using keyword matching
 */
function classifyLocal(title: string): ClassifyResult {
  const titleLower = (title || '').toLowerCase();
  const language = detectLanguage(title);
  const semanticType = detectSemanticType(title);
  const framework = detectFramework(title);

  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some(keyword => titleLower.includes(keyword))) {
      return {
        category,
        confidence: 0.7,
        source: 'local',
        language,
        semanticType,
        framework,
      };
    }
  }

  return {
    category: 'Uncategorized',
    confidence: 0.1,
    source: 'local',
    language,
    semanticType,
    framework,
  };
}

/**
 * Classify using OpenAI API
 */
async function classifyOpenAI(title: string): Promise<ClassifyResult> {
  if (!config.OPENAI_API_KEY) {
    return classifyLocal(title);
  }

  try {
    const client = new OpenAI({ apiKey: config.OPENAI_API_KEY });

    const prompt = [
      'Return ONLY valid JSON without markdown.',
      'Categorize the file/folder name.',
      'Valid categories: Code, Graphics, Audio, Video, Documents, Game, Archives, Uncategorized.',
      'Return fields: category (string), confidence (0..1).',
      `Name: ${String(title || '')}`,
    ].join('\n');

    const completion = await client.chat.completions.create({
      model: config.OPENAI_MODEL,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = completion.choices?.[0]?.message?.content || '{}';
    const json = JSON.parse(content);

    const category = String(json.category || 'Uncategorized');
    const confidence = Number(json.confidence || 0);

    const validCategories = ['Code', 'Graphics', 'Audio', 'Video', 'Documents', 'Game', 'Archives', 'Uncategorized'];
    if (!validCategories.includes(category)) {
      return classifyLocal(title);
    }

    return {
      category,
      confidence: Math.min(1, Math.max(0, confidence)),
      source: 'openai',
      language: detectLanguage(title),
      semanticType: detectSemanticType(title),
      framework: detectFramework(title),
    };
  } catch (error) {
    return classifyLocal(title);
  }
}

/**
 * Classify using Ollama local model
 */
async function classifyOllama(title: string): Promise<ClassifyResult> {
  try {
    const prompt = [
      'Return ONLY valid JSON without markdown.',
      'Categorize the file/folder name.',
      'Valid categories: Code, Graphics, Audio, Video, Documents, Game, Archives, Uncategorized.',
      'Return fields: category (string), confidence (0..1).',
      `Name: ${String(title || '')}`,
    ].join('\n');

    const response = await axios.post(
      config.OLLAMA_URL,
      {
        model: config.OLLAMA_MODEL,
        prompt,
        stream: false,
      },
      { timeout: 30000 }
    );

    const content = (response.data?.response || response.data?.output || '').toString().trim();
    const json = JSON.parse(content);

    const category = String(json.category || 'Uncategorized');
    const confidence = Number(json.confidence || 0);

    const validCategories = ['Code', 'Graphics', 'Audio', 'Video', 'Documents', 'Game', 'Archives', 'Uncategorized'];
    if (!validCategories.includes(category)) {
      return classifyLocal(title);
    }

    return {
      category,
      confidence: Math.min(1, Math.max(0, confidence)),
      source: 'ollama',
      language: detectLanguage(title),
      semanticType: detectSemanticType(title),
      framework: detectFramework(title),
    };
  } catch (error) {
    return classifyLocal(title);
  }
}

/**
 * Classify a file/folder name using configured AI provider
 */
export async function classifyItem(title: string): Promise<ClassifyResult> {
  if (!title || typeof title !== 'string') {
    throw new ValidationError('Title must be a non-empty string');
  }

  const provider = config.AI_PROVIDER.toLowerCase();

  if (provider === 'openai') {
    return classifyOpenAI(title);
  } else if (provider === 'ollama') {
    return classifyOllama(title);
  }

  return classifyLocal(title);
}
