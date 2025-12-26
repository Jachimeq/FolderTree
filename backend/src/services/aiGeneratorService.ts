import axios from 'axios';
import OpenAI from 'openai';
import { config } from '../config/env';
import { ValidationError } from '../utils/errors';

export interface GenerateOptions {
  prompt: string;
  provider?: 'openai' | 'ollama';
  model?: string;
}

/**
 * Generate folder structure using Ollama
 */
async function generateOllama(prompt: string, model?: string): Promise<string> {
  try {
    const response = await axios.post(
      config.OLLAMA_URL,
      {
        model: model || config.OLLAMA_MODEL,
        prompt,
        stream: false,
      },
      { timeout: 60000 }
    );

    const text = (response.data?.response || response.data?.output || '').toString().trim();
    return text;
  } catch (error) {
    throw new Error(`Ollama generation failed: ${(error as any).message}`);
  }
}

/**
 * Generate folder structure using OpenAI
 */
async function generateOpenAI(prompt: string, model?: string): Promise<string> {
  if (!config.OPENAI_API_KEY) {
    throw new ValidationError('OpenAI API key not configured');
  }

  try {
    const client = new OpenAI({ apiKey: config.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: model || config.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Return ONLY a plain-text indented folder/file tree. 2 spaces per level. No markdown, no explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const text = completion.choices?.[0]?.message?.content || '';
    return text.trim();
  } catch (error) {
    throw new Error(`OpenAI generation failed: ${(error as any).message}`);
  }
}

/**
 * Generate AI structure based on prompt and provider
 */
export async function generateStructure(options: GenerateOptions): Promise<string> {
  if (!options.prompt || typeof options.prompt !== 'string') {
    throw new ValidationError('Prompt must be a non-empty string');
  }

  const provider = (options.provider || config.AI_PROVIDER).toLowerCase() as 'openai' | 'ollama';

  if (provider === 'openai') {
    return generateOpenAI(options.prompt, options.model);
  } else if (provider === 'ollama') {
    return generateOllama(options.prompt, options.model);
  }

  throw new ValidationError(`Unknown AI provider: ${provider}`);
}
