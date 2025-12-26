/**
 * Swagger/OpenAPI documentation
 */
export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'FolderTreePRO API',
    version: '2.0.0',
    description: 'AI-powered folder structure generator with classification and collaboration',
    contact: {
      name: 'FolderTreePRO Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001/api',
      description: 'Development',
    },
    {
      url: 'https://api.foldertree.pro',
      description: 'Production',
    },
  ],
  components: {
    securitySchemes: {
      ApiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
          code: { type: 'string' },
        },
        required: ['success', 'error'],
      },
      HealthCheck: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          name: { type: 'string' },
          time: { type: 'string', format: 'date-time' },
          version: { type: 'string' },
        },
      },
      FsOp: {
        type: 'object',
        properties: {
          op: { type: 'string', enum: ['mkdir', 'writeFile'] },
          path: { type: 'string' },
          bytes: { type: 'number' },
          content: { type: 'string' },
        },
        required: ['op', 'path'],
      },
      ClassifyResult: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          source: { type: 'string', enum: ['local', 'openai', 'ollama'] },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Template: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          rating: { type: 'number' },
          downloads: { type: 'number' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Returns API health status',
        responses: {
          200: {
            description: 'Healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthCheck' },
              },
            },
          },
        },
      },
    },
    '/preview': {
      post: {
        summary: 'Preview folder structure',
        description: 'Generate and preview file operations without applying them',
        security: [
          { ApiKey: [] },
          { BearerAuth: [] },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  text: { type: 'string', description: 'Indented tree structure' },
                  outputDir: { type: 'string', description: 'Output directory path' },
                },
                required: ['text'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Preview successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        outputDir: { type: 'string' },
                        ops: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/FsOp' },
                        },
                        count: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/apply': {
      post: {
        summary: 'Apply folder structure',
        description: 'Create folders and files on disk',
        security: [
          { ApiKey: [] },
          { BearerAuth: [] },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  outputDir: { type: 'string' },
                  overwriteFiles: { type: 'boolean' },
                },
                required: ['text'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Applied successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        outputDir: { type: 'string' },
                        created: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/classify': {
      post: {
        summary: 'Classify file/folder',
        description: 'Classify a file or folder name into categories',
        security: [
          { ApiKey: [] },
          { BearerAuth: [] },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'File/folder name' },
                },
                required: ['title'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Classification result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/ClassifyResult' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/ai/generate': {
      post: {
        summary: 'Generate structure with AI',
        description: 'Generate folder structure using AI based on prompt',
        security: [
          { ApiKey: [] },
          { BearerAuth: [] },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  prompt: { type: 'string', description: 'Describe the desired structure' },
                  provider: { type: 'string', enum: ['openai', 'ollama'] },
                  model: { type: 'string', description: 'Specific model to use' },
                },
                required: ['prompt'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Generated structure',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        text: { type: 'string', description: 'Generated tree structure' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
