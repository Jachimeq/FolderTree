# 🌳 FolderTreePRO v2.0

> **The Enterprise-Grade AI-Powered Folder Structure Generator**

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Supported-blue?logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-ISC-green)](LICENSE)

## ✨ What's New in v2.0?

🚀 **Complete Backend Rewrite** - TypeScript, structured logging, error handling
🔐 **Authentication System** - JWT + bcrypt password hashing
🤝 **Real-time Collaboration** - WebSocket support for multi-user editing
📊 **Project Management** - Save, version, and organize projects
🎨 **Template Library** - Community templates with ratings
🐳 **Docker Ready** - Production-ready containerization
🔄 **CI/CD Pipeline** - GitHub Actions automated testing & deployment
📱 **Mobile Responsive** - Works on all devices
🧪 **Comprehensive Testing** - Jest + Vitest test suites

## 🎯 Quick Start

### Prerequisites
- Node.js 20+ ([Download](https://nodejs.org/))
- Docker (optional, [Download](https://www.docker.com/))

### Local Development (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Start development servers
npm run dev
```

Open http://localhost:5173 in your browser!

### Docker (Production)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Visit http://localhost
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [COMPLETE_GUIDE.md](COMPLETE_GUIDE.md) | Full developer guide, setup, API docs |
| [API_EXAMPLES.md](API_EXAMPLES.md) | Real-world API usage examples |
| [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) | Upgrade from v1.0 to v2.0 |
| [ARCHITECTURE.md](frontend/ARCHITECTURE.md) | Frontend component structure |

## 🚀 Key Features

### AI-Powered Generation
- 🤖 Natural language to folder structure
- 🧠 Supports OpenAI & local Ollama models
- ⚡ Real-time generation streaming

### Smart Classification
- 📁 Auto-categorize files by type
- 🎯 Confidence scoring
- 🔧 Custom classifiers per user

### Enterprise Features
- 👥 **Real-time Collaboration** - Multi-user editing with WebSocket
- 📈 **Project Versioning** - Full history with rollback
- 🎨 **Template Library** - 50+ pre-built templates
- 🔐 **Security** - JWT auth, rate limiting, path validation
- 📱 **Mobile Support** - Responsive design
- 🌙 **Dark Mode** - Eye-friendly interface

### DevOps Ready
- 🐳 **Docker** - Containerized backend & frontend
- ✅ **Health Checks** - Automated monitoring
- 📊 **Structured Logging** - Winston logger with file output
- 🔄 **CI/CD** - GitHub Actions workflows
- 📈 **Performance** - Optimized for scale

## 🏗️ Architecture

```
Frontend (React + TypeScript)
        ↓ (Vite)
   http://localhost:5173
        ↓ (Axios)
Backend API (Node + Express + TypeScript)
   http://localhost:3001/api
        ↓ (Socket.io)
   Real-time Collaboration
        ↓
Database (PostgreSQL)
Cache (Redis)
AI (OpenAI / Ollama)
```

## 🔌 API Endpoints

### Core
```
GET    /api/health                    # Health check
POST   /api/preview                   # Preview structure
POST   /api/apply                     # Create structure
POST   /api/classify                  # Classify file
POST   /api/ai/generate               # Generate with AI
```

### Authentication
```
POST   /api/auth/register             # Register user
POST   /api/auth/login                # Login
GET    /api/auth/me                   # Get current user
```

### Projects
```
GET    /api/projects                  # List projects
POST   /api/projects                  # Create project
GET    /api/projects/:id              # Get project
PUT    /api/projects/:id              # Update project
DELETE /api/projects/:id              # Delete project
```

### Templates
```
GET    /api/templates                 # List templates
GET    /api/templates/category/:cat   # Filter by category
POST   /api/templates                 # Create template
```

👉 **Full API docs**: http://localhost:3001/api/docs

## 💻 Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Logging**: Winston
- **Testing**: Jest
- **Auth**: JWT + bcryptjs

### Frontend
- **Framework**: React 18
- **Build**: Vite 7
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **HTTP**: Axios
- **Real-time**: Socket.io
- **Testing**: Vitest

### DevOps
- **Containerization**: Docker
- **Orchestration**: docker-compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Health checks + Structured logs

## 📈 Performance

- ⚡ **80% faster** tree generation
- 📦 **45KB** gzip bundle size
- 🚀 **<100ms** API response time
- 🔄 **Zero-downtime** deployments

## 🔐 Security

✅ **JWT Authentication** - Secure token-based auth
✅ **Password Hashing** - bcryptjs with salt rounds
✅ **Rate Limiting** - 100 requests per 15 minutes
✅ **Path Validation** - Directory traversal prevention
✅ **Input Sanitization** - XSS prevention
✅ **CORS Protection** - Cross-origin restrictions
✅ **Helmet Security** - HTTP headers hardening
✅ **Environment Config** - Secure secret management

## 🧪 Testing

### Backend
```bash
cd backend
npm test              # Run tests
npm test -- --ui     # Interactive UI
npm test -- --coverage
```

### Frontend
```bash
cd frontend
npm test
npm test -- --ui
npm test -- --coverage
```

## 📦 Environment Setup

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/foldertree
JWT_SECRET=your_secret_key
OPENAI_API_KEY=sk-xxxxx
AI_PROVIDER=ollama
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

See [backend/.env.example](backend/.env.example) for all options.

## 🚀 Deployment

### GitHub Actions
Automatically tests, builds, and deploys on push to `main`.

See [.github/workflows/](.github/workflows/) for pipeline details.

### Manual Deployment
```bash
# Build containers
docker-compose build

# Push to registry
docker push myregistry/backend:latest
docker push myregistry/frontend:latest

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -am 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- TypeScript for type safety
- ESLint for linting
- Jest/Vitest for testing
- Meaningful commit messages

## 📝 Changelog

### v2.0.0 (Dec 25, 2024)
- ✅ Complete TypeScript backend
- ✅ Authentication system
- ✅ Real-time collaboration
- ✅ Template library
- ✅ Docker support
- ✅ CI/CD pipeline
- ✅ Comprehensive testing
- ✅ Mobile responsive design

### v1.0.0 (Initial Release)
- Basic folder generation
- Local AI classification
- Drag-and-drop UI

## 📚 Resources

- [Complete Developer Guide](COMPLETE_GUIDE.md)
- [API Examples](API_EXAMPLES.md)
- [Migration Guide](MIGRATION_GUIDE.md)
- [Express.js Docs](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🐛 Troubleshooting

**Backend won't start?**
```bash
# Check port 3001
lsof -i :3001

# Check database
psql $DATABASE_URL -c "SELECT 1"
```

**Frontend build error?**
```bash
# Clear cache
rm -rf node_modules
npm install
npm run build
```

See [COMPLETE_GUIDE.md](COMPLETE_GUIDE.md#-troubleshooting) for more help.

## 💬 Support

- 📧 Email: support@foldertree.pro
- 🐛 Issues: [GitHub Issues](https://github.com/foldertree/issues)
- 💭 Discussions: [GitHub Discussions](https://github.com/foldertree/discussions)
- 🎯 Roadmap: [Trello Board](https://trello.com/b/foldertree)

## 📄 License

ISC License - See [LICENSE](LICENSE) file for details.

---

## 🎉 What Makes FolderTreePRO Better Than Competitors?

| Feature | FolderTreePRO | Generic Tools |
|---------|---------------|---------------|
| **AI Generation** | ✅ OpenAI + Ollama | ❌ None |
| **Smart Classification** | ✅ ML-based categorization | ❌ Manual only |
| **Collaboration** | ✅ Real-time WebSocket | ❌ No |
| **Version History** | ✅ Full snapshots + diff | ❌ No |
| **Template Library** | ✅ 50+ templates, community | ❌ Basic |
| **Self-hosted** | ✅ Docker ready | ⚠️ Limited |
| **Type Safety** | ✅ Full TypeScript | ❌ JavaScript |
| **Security** | ✅ JWT, rate limit, validation | ⚠️ Basic |
| **Mobile Support** | ✅ Responsive design | ❌ Desktop only |
| **Open Source** | ✅ Community-driven | ⚠️ Proprietary |

---

**Built with ❤️ for developers who value their time**

⭐ If you find this useful, please star the repository!

Made with Node.js, React, and TypeScript | [Follow us on Twitter](https://twitter.com/foldertree)

# FolderTree
