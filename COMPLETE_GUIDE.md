# FolderTreePRO - Complete Developer Guide

## 🚀 Project Overview

FolderTreePRO v2.0 is an enterprise-grade SaaS platform for intelligent folder structure generation, AI-powered file classification, and real-time team collaboration.

### Key Features

✅ **AI-Powered Generation** - Generate folder structures from natural language prompts
✅ **Smart Classification** - Auto-categorize files using OpenAI or local Ollama
✅ **Real-time Collaboration** - Multi-user editing with WebSocket support
✅ **Project Management** - Save, version, and organize projects
✅ **Template Library** - Community templates with ratings and search
✅ **Security-First** - JWT auth, rate limiting, path validation
✅ **Mobile-Responsive** - Works on desktop, tablet, and mobile
✅ **Production-Ready** - Docker, CI/CD, comprehensive logging

---

## 📁 Project Structure

```
FolderTreePRO/
├── backend/                 # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/         # Configuration (env, logger, swagger)
│   │   ├── middleware/     # Auth, error handling, rate limiting
│   │   ├── routes/         # API endpoints (auth, templates, projects)
│   │   ├── services/       # Business logic (AI, filesystem, auth)
│   │   ├── types/          # TypeScript interfaces
│   │   ├── utils/          # Validators, error classes, path security
│   │   ├── __tests__/      # Jest test suites
│   │   └── index.ts        # Express app entry point
│   ├── dist/               # Compiled JavaScript (generated)
│   ├── migrations/         # Database schema
│   ├── .env.example        # Environment template
│   ├── Dockerfile          # Container image
│   ├── tsconfig.json       # TypeScript config
│   ├── jest.config.js      # Jest testing config
│   └── package.json
│
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   │   ├── ui/         # Button, Input, Modal, etc.
│   │   │   ├── layout/     # Header, Sidebar, MainLayout
│   │   │   ├── editor/     # Tree editor components
│   │   │   ├── auth/       # Login, Register
│   │   │   ├── collaboration/  # Real-time features
│   │   │   └── ...
│   │   ├── store/          # Zustand stores
│   │   ├── api/            # API client layers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Helpers, formatters
│   │   └── App.tsx         # Main app
│   ├── dist/               # Built production files
│   ├── Dockerfile          # Container image (nginx)
│   ├── vite.config.ts      # Vite configuration
│   ├── tailwind.config.ts  # Tailwind CSS
│   └── package.json
│
├── docker-compose.yml      # Multi-container orchestration
├── .github/workflows/
│   ├── ci.yml             # Test & build workflow
│   └── deploy.yml         # Deployment workflow
├── .gitignore             # Git ignore rules
└── README.md              # This file

```

---

## 🔧 Setup Instructions

### Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **Docker** (optional) - [Download](https://www.docker.com/)
- **PostgreSQL 16** (if running locally)
- **Redis** (optional, for advanced rate limiting)

### Local Development Setup

```bash
# 1. Clone and install dependencies
cd FolderTreePRO
npm install

# 2. Setup backend
cd backend
cp .env.example .env
# Edit .env with your settings
npm run build

# 3. Setup frontend
cd ../frontend
npm run build

# 4. Start development servers
cd ..
npm run dev
```

#### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **API Docs**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/health

### Docker Setup (Recommended for Production)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Shutdown
docker-compose down
```

Services will be available at:
- Frontend: http://localhost
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## 🔐 Environment Variables

### Backend (.env or api.env)

```env
# Core
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/foldertree

# Security
API_KEY=optional_api_key_for_direct_api_calls
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# AI Providers
AI_PROVIDER=ollama  # or 'openai'
OPENAI_API_KEY=sk-xxxx
OPENAI_MODEL=gpt-4o-mini
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=mistral

# Output
DEFAULT_OUTPUT_DIR=./generated
ALLOWED_OUTPUT_BASE=/home/user/projects

# Redis
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=FolderTreePRO
```

---

## 📚 API Documentation

### Core Endpoints

#### Health Check
```
GET /api/health
```

#### Preview Tree Structure
```
POST /api/preview
Content-Type: application/json

{
  "text": "src\n  components\n  pages\n  utils.ts\n  App.tsx",
  "outputDir": "/path/to/output"
}

Response: { success: true, data: { ops, count, outputDir } }
```

#### Apply Tree Structure
```
POST /api/apply

{
  "text": "...",
  "overwriteFiles": false
}

Response: { success: true, data: { success: true, created: 42 } }
```

#### Classify File/Folder
```
POST /api/classify

{ "title": "utils.ts" }

Response: { success: true, data: { category: "Code", confidence: 0.95, source: "local" } }
```

#### Generate with AI
```
POST /api/ai/generate

{
  "prompt": "Create a React + TypeScript monorepo",
  "provider": "ollama",
  "model": "mistral"
}

Response: { success: true, data: { text: "src/\n  components/" } }
```

### Authentication Endpoints

#### Register
```
POST /api/auth/register

{ "email": "user@example.com", "name": "John Doe", "password": "SecurePass123" }

Response: { success: true, data: { token, user } }
```

#### Login
```
POST /api/auth/login

{ "email": "user@example.com", "password": "SecurePass123" }

Response: { success: true, data: { token, user } }
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>

Response: { success: true, data: { id, email } }
```

### Project Endpoints

```
GET /api/projects              # List user's projects
POST /api/projects             # Create project
GET /api/projects/:id          # Get project
PUT /api/projects/:id          # Update project
DELETE /api/projects/:id       # Delete project
```

### Template Endpoints

```
GET /api/templates                  # List all templates
GET /api/templates/category/:cat    # Filter by category
POST /api/templates                 # Create custom template
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run tests
npm test

# Run with UI
npm test -- --ui

# Coverage
npm test -- --coverage
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Coverage
npm test -- --coverage
```

### E2E Tests (Coming Soon)

```bash
npm run test:e2e
```

---

## 🚀 Deployment

### GitHub Actions CI/CD

Workflows automatically run on:
- Push to `main` or `develop`
- Pull requests
- Manual trigger

**Workflows:**
1. `.github/workflows/ci.yml` - Test & Build
2. `.github/workflows/deploy.yml` - Deploy to production

### Manual Deployment

```bash
# Build Docker images
docker-compose build

# Push to registry
docker tag backend ghcr.io/username/backend:latest
docker push ghcr.io/username/backend:latest

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔒 Security Considerations

### Implemented

✅ **JWT Authentication** - Secure token-based auth
✅ **Rate Limiting** - Prevent abuse (100 requests per 15 min)
✅ **Path Validation** - Prevent directory traversal attacks
✅ **Input Sanitization** - XSS prevention
✅ **CORS Protection** - Cross-origin restrictions
✅ **Helmet Security** - HTTP headers hardening
✅ **Password Hashing** - bcryptjs with salt
✅ **HTTPS Ready** - SSL/TLS support in production

### Best Practices

- ✅ Never commit `.env` files
- ✅ Rotate secrets regularly
- ✅ Use strong passwords (min 8 chars, mixed case, numbers)
- ✅ Enable HTTPS in production
- ✅ Monitor logs for suspicious activity
- ✅ Update dependencies regularly (`npm audit fix`)
- ✅ Use environment-specific configs

---

## 🔄 Workflow Examples

### Create Folder Structure

```bash
curl -X POST http://localhost:3001/api/apply \
  -H "Content-Type: application/json" \
  -d '{
    "text": "src\n  components\n  pages",
    "overwriteFiles": false
  }'
```

### Generate with AI

```bash
curl -X POST http://localhost:3001/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a production-ready React + Node.js monorepo structure",
    "provider": "openai"
  }'
```

### Classify Multiple Files

```bash
for file in "utils.ts" "logo.png" "video.mp4" "report.pdf"; do
  curl -X POST http://localhost:3001/api/classify \
    -H "Content-Type: application/json" \
    -d "{\"title\": \"$file\"}"
done
```

---

## 📊 Performance Optimization

### Backend

- **Connection Pooling** - Database connection pool (pg)
- **Caching** - Redis for session management
- **Compression** - gzip middleware
- **Async/Await** - Non-blocking operations
- **Indexed Queries** - Database indexes on foreign keys
- **Lazy Loading** - Load data only when needed

### Frontend

- **Code Splitting** - Route-based lazy loading
- **Image Optimization** - Minified SVGs, responsive images
- **Tree Shaking** - Unused code elimination
- **Memoization** - React.memo for expensive components
- **Virtual Scrolling** - Render only visible items
- **Service Workers** - PWA support (planned)

---

## 🤝 Contributing

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules (run `npm run lint`)
- 80 character line limit
- Meaningful commit messages
- Add tests for new features

### Development Workflow

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Make changes and commit: `git commit -am 'Add amazing feature'`
3. Push branch: `git push origin feature/amazing-feature`
4. Open Pull Request with description

---

## 📝 Logging

### Backend Logs

Logs are written to `backend/logs/`:
- `combined.log` - All logs
- `error.log` - Errors only

Example log entry:
```json
{
  "level": "info",
  "message": "HTTP Request",
  "timestamp": "2024-01-15 10:30:45",
  "method": "POST",
  "path": "/api/preview",
  "statusCode": 200,
  "duration": "145ms"
}
```

### View Logs

```bash
# Live logs (Docker)
docker-compose logs -f backend

# File logs
tail -f backend/logs/combined.log
```

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check port 3001 is not in use
lsof -i :3001

# Check environment variables
echo $DATABASE_URL

# Check database connection
psql $DATABASE_URL -c "SELECT 1"
```

### Frontend build errors

```bash
# Clear cache
rm -rf node_modules frontend/.next
npm install

# Rebuild
npm run build
```

### Docker issues

```bash
# Reset containers
docker-compose down -v
docker-compose up --build

# Check service health
docker-compose ps
docker-compose logs <service>
```

---

## 📚 Additional Resources

- [Express.js Docs](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [Docker Documentation](https://docs.docker.com/)

---

## 📄 License

ISC - See LICENSE file for details

---

## ✨ Features Roadmap

- [ ] Real-time WebSocket collaboration
- [ ] Advanced version control with diffs
- [ ] GraphQL API option
- [ ] Mobile app (React Native)
- [ ] OAuth providers (Google, GitHub)
- [ ] Stripe billing integration
- [ ] Advanced analytics dashboard
- [ ] Team management & permissions
- [ ] API rate limit dashboard
- [ ] Custom domain support

---

## 🎯 Support

- 📧 Email: support@foldertree.pro
- 🐛 Issues: github.com/foldertree/issues
- 💬 Discord: [Join our community](https://discord.gg/foldertree)
- 📖 Wiki: [Project Wiki](https://wiki.foldertree.pro)

---

**Last Updated**: December 25, 2025
**Version**: 2.0.0
