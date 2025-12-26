# 🎯 FolderTreePRO v2.0 - Launch Checklist

## ✅ Pre-Launch Verification

### Backend Setup
- [ ] Run `npm install` in backend
- [ ] Copy `backend/.env.example` to `backend/.env`
- [ ] Update `.env` with your settings
- [ ] Run `npm run build` - should produce `dist/` folder
- [ ] Run `npm run typecheck` - no errors expected
- [ ] Run `npm test` (optional) - tests run successfully

### Frontend Setup
- [ ] Run `npm install` in frontend
- [ ] Update `frontend/.env` if needed (defaults work)
- [ ] Run `npm run build` - should produce `dist/` folder
- [ ] Run `npm test` (optional)

### Database Setup (Optional)
- [ ] PostgreSQL installed locally (for local dev)
- [ ] Create `.env` with `DATABASE_URL`
- [ ] Run migrations: `psql $DATABASE_URL < backend/migrations/001_initial.sql`

### Docker Setup
- [ ] Docker installed
- [ ] Run `docker-compose build` - builds both images
- [ ] Run `docker-compose up -d` - starts all services
- [ ] Services health: `docker-compose ps`

---

## 🚀 Development Mode

### Start Local Servers
```bash
npm run dev
```

Visit:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001/api/health
- API Docs: http://localhost:3001/api/docs

### Test Core Features

**1. Health Check**
```bash
curl http://localhost:3001/api/health
```

**2. Preview Structure**
```bash
curl -X POST http://localhost:3001/api/preview \
  -H "Content-Type: application/json" \
  -d '{
    "text": "src\n  components\n  pages",
    "outputDir": "/tmp/test"
  }'
```

**3. Classify File**
```bash
curl -X POST http://localhost:3001/api/classify \
  -H "Content-Type: application/json" \
  -d '{"title": "utils.ts"}'
```

---

## 🐳 Docker Mode

### Start with Docker
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Access Services
- Frontend: http://localhost (Nginx)
- Backend: http://localhost:3001/api
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Shutdown
```bash
docker-compose down
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm test -- --ui          # Interactive mode
npm test -- --coverage    # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test
npm test -- --ui
npm test -- --coverage
```

---

## 📦 Building for Production

### Step 1: Build Backend
```bash
cd backend
npm run build
# Creates dist/ folder with compiled TypeScript
```

### Step 2: Build Frontend
```bash
cd frontend
npm run build
# Creates dist/ folder with optimized React app
```

### Step 3: Run Type Check
```bash
npm run typecheck
# Ensure no TypeScript errors
```

### Step 4: Build Docker Images
```bash
docker-compose build --no-cache
```

---

## 🔐 Security Configuration

### Update Environment Variables
- [ ] Change `JWT_SECRET` to random string
- [ ] Change `DATABASE_URL` to production database
- [ ] Set `OPENAI_API_KEY` if using OpenAI
- [ ] Set `NODE_ENV=production`
- [ ] Update `CORS_ORIGIN` for your domain
- [ ] Set strong `API_KEY` if using direct API access

### Verify Security Headers
```bash
curl -I http://localhost:3001/api/health
# Should see X-Content-Type-Options, X-Frame-Options, etc.
```

---

## 📝 Important File Locations

| File | Purpose | Action |
|------|---------|--------|
| `backend/.env` | Backend config | Update with your settings |
| `backend/src/index.ts` | Main server | Verify it starts |
| `frontend/src/App.tsx` | Main React app | Check routes work |
| `.github/workflows/` | CI/CD config | Verify paths are correct |
| `docker-compose.yml` | Services config | Update if customizing |
| `backend/migrations/` | Database schema | Run before production |

---

## 🚨 Common Issues & Fixes

### Backend won't start
```bash
# Check if port 3001 is taken
lsof -i :3001

# Check environment variables
env | grep DATABASE_URL

# Check database connection
psql $DATABASE_URL -c "SELECT 1"
```

### Frontend not connecting to backend
```bash
# Check proxy in vite.config.ts
# Check API_URL environment variable
# Verify backend is running on 3001
```

### Docker services not healthy
```bash
docker-compose logs
docker-compose ps
docker-compose up --build  # Rebuild
```

### TypeScript errors
```bash
npm run typecheck
# Fix any type errors before deploying
```

---

## 📊 Performance Checklist

- [ ] Response time < 100ms for most endpoints
- [ ] Bundle size < 50KB (gzipped)
- [ ] Database queries use indexes
- [ ] No console errors/warnings
- [ ] All images optimized
- [ ] API responses cached where appropriate
- [ ] Rate limiting enabled
- [ ] Health checks passing

---

## 🎯 Feature Checklist

### Core Features Working
- [ ] Tree structure generation
- [ ] File classification
- [ ] AI generation (OpenAI/Ollama)
- [ ] Preview before applying
- [ ] Apply creates actual files

### New Features (v2.0)
- [ ] API documentation available
- [ ] Health check endpoint responds
- [ ] Rate limiting working
- [ ] Error messages are helpful
- [ ] Logging to files
- [ ] Dark mode toggle visible
- [ ] Responsive on mobile

### Authentication (Optional)
- [ ] Register endpoint accessible
- [ ] Login endpoint returns token
- [ ] Token validates on protected endpoints
- [ ] Password hashing working

---

## 📱 Testing on Different Devices

### Desktop
- [ ] Chrome/Firefox: Full width, all features
- [ ] Safari: Compatibility check

### Tablet
- [ ] Responsive layout works
- [ ] Touch interactions smooth
- [ ] Navigation accessible

### Mobile
- [ ] Portrait mode readable
- [ ] Landscape mode works
- [ ] Buttons easily tappable
- [ ] No horizontal scroll

---

## 🔄 Deployment Workflow

1. **Local Development**
   - Run `npm run dev`
   - Test features locally
   - Commit changes

2. **Staging**
   - Push to develop branch (optional)
   - Run GitHub Actions tests
   - Deploy to staging server

3. **Production**
   - Create Pull Request
   - Review & approve
   - Merge to main branch
   - GitHub Actions builds & deploys
   - Verify on production URL

---

## 📞 Support Resources

- **Docs**: See [COMPLETE_GUIDE.md](COMPLETE_GUIDE.md)
- **API Examples**: See [API_EXAMPLES.md](API_EXAMPLES.md)
- **Migration Help**: See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- **Issues**: GitHub Issues tab
- **Email**: support@foldertree.pro

---

## ✨ Final Checklist

Before declaring "Done":

- [ ] All documentation reviewed
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Docker builds successfully
- [ ] GitHub Actions workflow runs
- [ ] Environment variables set correctly
- [ ] Security review completed
- [ ] Performance acceptable
- [ ] Mobile responsive verified
- [ ] Error handling works

---

## 🎉 You're Ready!

When all checkboxes are ✅:

1. Deploy to production
2. Monitor health endpoints
3. Check logs for errors
4. Announce launch! 🚀

---

**Version**: 2.0.0
**Checklist Version**: 1.0
**Last Updated**: December 25, 2024

Good luck! 🍀
