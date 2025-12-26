import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from './config/logger';
import { config } from './config/env';
import { errorHandler } from './middleware';
import apiRoutes from './routes/api';
// import authRoutes from './routes/auth';
// import templatesRoutes from './routes/templates';
// import projectsRoutes from './routes/projects';
import cleanupRoutes from './routes/cleanup';
import organizeRoutes from './routes/organize';

const app = express();

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.CORS_ORIGIN : '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging
// app.use(requestLogger);

// Mount routes
app.use('/api', apiRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/templates', templatesRoutes);
// app.use('/api/projects', projectsRoutes);
app.use('/api/cleanup', cleanupRoutes);
app.use('/api/organize', organizeRoutes);

// API Docs
app.get('/api/docs', (_req, res) => {
  res.json({
    message: 'FolderTreePRO API Documentation',
    version: '2.0.0',
    baseUrl: 'http://localhost:3001/api',
    endpoints: {
      core: [
        'GET /api/health - Health check',
        'POST /api/preview - Preview tree structure',
        'POST /api/apply - Apply tree structure',
        'POST /api/classify - Classify file/folder',
        'POST /api/ai/generate - Generate with AI',
      ],
      auth: [
        'POST /api/auth/register - Register user',
        'POST /api/auth/login - Login user',
        'GET /api/auth/me - Get current user',
      ],
      templates: [
        'GET /api/templates - List templates',
        'GET /api/templates/category/:category - Filter by category',
        'POST /api/templates - Create template',
      ],
      projects: [
        'GET /api/projects - List user projects',
        'POST /api/projects - Create project',
        'GET /api/projects/:id - Get project',
        'PUT /api/projects/:id - Update project',
        'DELETE /api/projects/:id - Delete project',
      ],
    },
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    code: 'NOT_FOUND',
  });
});

// Error handling (must be last)
app.use(errorHandler);

// Start server
const PORT = config.PORT;

app.listen(PORT, () => {
  logger.info(`✅ Backend running on http://localhost:${PORT}`);
  logger.info(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  logger.info(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  logger.info(`Environment: ${config.NODE_ENV}`);
  logger.info(`AI Provider: ${config.AI_PROVIDER}`);
});

export default app;
