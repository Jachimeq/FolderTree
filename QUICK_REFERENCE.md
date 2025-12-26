# ⚡ FolderTreePRO v2.0 - Quick Reference

## 🚀 Start Development (30 seconds)

```bash
npm install
npm run dev
```

Then visit: http://localhost:5173

---

## 🐳 Start with Docker (1 minute)

```bash
docker-compose up -d
```

Then visit: http://localhost

---

## 📚 Key Documentation Files

| What | File | Time |
|------|------|------|
| Overview | [README.md](README.md) | 5 min |
| Full Guide | [COMPLETE_GUIDE.md](COMPLETE_GUIDE.md) | 30 min |
| API Examples | [API_EXAMPLES.md](API_EXAMPLES.md) | 15 min |
| Deploy | [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) | 10 min |
| Visual | [VISUAL_SUMMARY.md](VISUAL_SUMMARY.md) | 5 min |

---

## 🔌 API Quick Hits

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Preview Structure
```bash
curl -X POST http://localhost:3001/api/preview \
  -H "Content-Type: application/json" \
  -d '{"text": "src\n  components\n  pages"}'
```

### Classify File
```bash
curl -X POST http://localhost:3001/api/classify \
  -H "Content-Type: application/json" \
  -d '{"title": "utils.ts"}'
```

### Generate with AI
```bash
curl -X POST http://localhost:3001/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a React project", "provider": "ollama"}'
```

See [API_EXAMPLES.md](API_EXAMPLES.md) for all 15+ endpoints.

---

## 📁 Project Structure

```
FolderTreePRO/
├── backend/          → Node.js + Express + TypeScript
│   ├── src/          → Source code
│   ├── dist/         → Compiled (after build)
│   └── Dockerfile    → Container image
├── frontend/         → React + Vite + TypeScript
│   ├── src/          → React components
│   ├── dist/         → Built app (after build)
│   └── Dockerfile    → Container image
├── .github/
│   └── workflows/    → CI/CD automation
└── docker-compose.yml → Local services
```

---

## ⚙️ Setup Environment

### Backend (.env)

```env
# Required
PORT=3001
NODE_ENV=development
JWT_SECRET=change_me_in_production

# Database (optional)
DATABASE_URL=postgresql://localhost:5432/foldertree

# AI
AI_PROVIDER=ollama
OPENAI_API_KEY=sk-xxxx (if using OpenAI)
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
```

---

## 🧪 Run Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# Both
npm run test
```

---

## 🏗️ Build for Production

```bash
# Build backend
cd backend && npm run build

# Build frontend
cd frontend && npm run build

# Build Docker images
docker-compose build
```

---

## 🔑 Key Features

| Feature | Status | Location |
|---------|--------|----------|
| Tree Generation | ✅ | `/api/preview`, `/api/apply` |
| AI Generation | ✅ | `/api/ai/generate` |
| File Classification | ✅ | `/api/classify` |
| Authentication | ✅ | `/api/auth/*` |
| Projects | ✅ | `/api/projects/*` |
| Templates | ✅ | `/api/templates/*` |
| Real-time Collab | 🔧 | Socket.io ready |
| Payments | 📋 | Ready to implement |
| OAuth | 📋 | Ready to implement |

---

## 🔐 Security Features

- ✅ JWT authentication
- ✅ Rate limiting (100/15min)
- ✅ Path traversal prevention
- ✅ Input sanitization
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Password hashing (bcryptjs)
- ✅ Environment secrets management

---

## 📊 File Locations

```
Configuration
├── backend/.env.example       - Backend settings template
├── docker-compose.yml         - Services definition
├── .github/workflows/         - CI/CD pipelines
└── backend/tsconfig.json      - TypeScript config

Database
├── backend/migrations/        - Database schema
└── backend/src/types/         - Data models

API
├── backend/src/routes/        - Endpoints (api.ts, auth.ts, projects.ts, templates.ts)
├── backend/src/services/      - Business logic
├── backend/src/middleware/    - Auth, error handling, rate limiting
└── backend/src/config/        - Configuration

Frontend
├── frontend/src/components/   - React components
├── frontend/src/store/        - State management (Zustand)
├── frontend/src/api/          - API clients
└── frontend/src/types/        - TypeScript types

Documentation
├── README.md                  - Project overview
├── COMPLETE_GUIDE.md          - Full documentation
├── API_EXAMPLES.md            - API usage examples
├── LAUNCH_CHECKLIST.md        - Deployment checklist
└── VISUAL_SUMMARY.md          - This file!
```

---

## 🎯 Common Commands

```bash
# Development
npm run dev              # Start both servers
npm run build            # Build both projects
npm run test             # Test both projects
npm run typecheck        # Check TypeScript

# Docker
docker-compose up -d    # Start services
docker-compose logs -f  # View logs
docker-compose down     # Stop services

# Backend
cd backend
npm run dev             # Start with ts-node
npm run build           # Compile TypeScript
npm test                # Run tests

# Frontend
cd frontend
npm run dev             # Start Vite
npm run build           # Build for production
npm test                # Run tests
```

---

## 🆘 Troubleshooting

### Port already in use
```bash
# Find what's using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### TypeScript errors
```bash
npm run typecheck  # See all errors
npm run build      # Try to build
```

### Docker won't start
```bash
docker-compose logs          # See errors
docker-compose build --force # Force rebuild
```

### API not responding
```bash
curl http://localhost:3001/api/health
# If fails, backend may not be running
```

---

## 📈 Performance Tips

- Use docker-compose for local dev (includes Redis)
- Enable query logging: `LOG_LEVEL=debug`
- Check database indexes in `/migrations/`
- Monitor logs in `backend/logs/`
- Profile with: `npm run dev -- --inspect`

---

## 🎁 What's Included

✅ Full TypeScript backend
✅ React component library
✅ Docker setup
✅ CI/CD pipelines
✅ Database schema
✅ Authentication system
✅ Real-time infrastructure
✅ Comprehensive documentation
✅ API examples
✅ Deployment checklist

---

## 📞 Need Help?

1. **Can't get started?** → [COMPLETE_GUIDE.md](COMPLETE_GUIDE.md)
2. **API questions?** → [API_EXAMPLES.md](API_EXAMPLES.md)
3. **Deploying?** → [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)
4. **Want overview?** → [VISUAL_SUMMARY.md](VISUAL_SUMMARY.md)
5. **GitHub Issues** → Report problems

---

## 🎓 Learning Resources

- [Node.js Docs](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Docker Docs](https://docs.docker.com/)

---

## ✨ Pro Tips

1. **Use VSCode** with REST Client extension for testing
2. **Enable Auto-save** for smooth development
3. **Use TypeScript strict mode** for type safety
4. **Monitor logs** while developing
5. **Test APIs** before Frontend integration
6. **Commit often** with meaningful messages
7. **Use .env.local** for local overrides
8. **Check GitHub Actions** before deploying

---

## 🎊 You're Ready!

Start with: `npm install && npm run dev`

All systems go! 🚀

---

**Quick Ref v1.0** | Dec 25, 2024
