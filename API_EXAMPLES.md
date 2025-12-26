# API Usage Examples

## Authentication Flow

### 1. Register a new user

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePass123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### 3. Get current user (requires token)

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

---

## File Structure Operations

### 1. Preview structure (see operations without creating)

```bash
curl -X POST http://localhost:3001/api/preview \
  -H "Content-Type: application/json" \
  -d '{
    "text": "src\n  components\n    Button.tsx\n    Modal.tsx\n  pages\n    Home.tsx\n  App.tsx\n  main.tsx",
    "outputDir": "/tmp/my-project"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "outputDir": "/tmp/my-project",
    "count": 8,
    "ops": [
      { "op": "mkdir", "path": "/tmp/my-project/src" },
      { "op": "mkdir", "path": "/tmp/my-project/src/components" },
      { "op": "writeFile", "path": "/tmp/my-project/src/components/Button.tsx" },
      ...
    ]
  }
}
```

### 2. Apply structure (actually create files)

```bash
curl -X POST http://localhost:3001/api/apply \
  -H "Content-Type: application/json" \
  -d '{
    "text": "src\n  components\n    Button.tsx\n  App.tsx",
    "outputDir": "/tmp/my-app",
    "overwriteFiles": false
  }'
```

---

## Classification

### 1. Classify a single file

```bash
curl -X POST http://localhost:3001/api/classify \
  -H "Content-Type: application/json" \
  -d '{ "title": "utils.ts" }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "Code",
    "confidence": 0.95,
    "source": "local"
  }
}
```

### 2. Batch classify files

```bash
#!/bin/bash
files=("index.ts" "logo.png" "video.mp4" "report.pdf" "config.yml")

for file in "${files[@]}"; do
  curl -s -X POST http://localhost:3001/api/classify \
    -H "Content-Type: application/json" \
    -d "{\"title\": \"$file\"}" | jq ".data | {file: \"$file\", category: .category, confidence: .confidence}"
done
```

---

## AI Generation

### 1. Generate with OpenAI

```bash
curl -X POST http://localhost:3001/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a production-ready monorepo with backend (Node + Express) and frontend (React + TypeScript)",
    "provider": "openai",
    "model": "gpt-4o-mini"
  }'
```

### 2. Generate with Ollama (local)

```bash
curl -X POST http://localhost:3001/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a Django project structure with models, views, and tests directories",
    "provider": "ollama",
    "model": "mistral"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "project_root/\n  manage.py\n  requirements.txt\n  myapp/\n    models.py\n    views.py\n    tests.py\n    urls.py\n  templates/\n  static/"
  }
}
```

---

## Template Management

### 1. List all templates

```bash
curl http://localhost:3001/api/templates
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tpl-1",
      "name": "React + TypeScript",
      "category": "web",
      "description": "Full-stack React with TypeScript",
      "rating": 4.8,
      "downloads": 1250
    },
    ...
  ]
}
```

### 2. Filter by category

```bash
curl http://localhost:3001/api/templates/category/web
```

### 3. Create custom template

```bash
curl -X POST http://localhost:3001/api/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "name": "My Custom React Template",
    "category": "web",
    "description": "My personal project structure",
    "tree": {
      "src": ["components", "pages", "hooks", "utils"],
      "public": ["favicon.ico"],
      "tests": []
    }
  }'
```

---

## Project Management

### 1. Create a project

```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "name": "My Web App",
    "description": "Fullstack React + Node app",
    "tree": { "items": {}, "rootId": "root" }
  }'
```

### 2. List user projects

```bash
curl -X GET http://localhost:3001/api/projects \
  -H "Authorization: Bearer <TOKEN>"
```

### 3. Get specific project

```bash
curl -X GET http://localhost:3001/api/projects/project-id \
  -H "Authorization: Bearer <TOKEN>"
```

### 4. Update project

```bash
curl -X PUT http://localhost:3001/api/projects/project-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "name": "Updated Name",
    "description": "Updated description",
    "tree": { ... }
  }'
```

### 5. Delete project

```bash
curl -X DELETE http://localhost:3001/api/projects/project-id \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Advanced Usage

### With Node.js/axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set token after login
const setToken = (token) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Example: Generate and apply structure
async function generateProject(prompt) {
  try {
    // Generate structure from AI
    const { data: generated } = await api.post('/ai/generate', {
      prompt,
      provider: 'openai',
    });

    console.log('Generated:', generated.data.text);

    // Apply to disk
    const { data: applied } = await api.post('/apply', {
      text: generated.data.text,
      outputDir: '/home/user/projects/new-app',
      overwriteFiles: false,
    });

    console.log('Created:', applied.data.created, 'items');
  } catch (error) {
    console.error('Error:', error.response?.data);
  }
}

generateProject('Create a Vue.js + Strapi CMS project');
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "code": "UNAUTHORIZED"
}
```

**400 Bad Request**
```json
{
  "success": false,
  "error": "Title must be a non-empty string",
  "code": "VALIDATION_ERROR"
}
```

**429 Rate Limited**
```json
{
  "success": false,
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

---

## Rate Limiting

Default limits:
- **100 requests per 15 minutes** per IP
- Response headers include:
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1704067200000`

---

## WebSocket Events (Real-time Collaboration)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Join a project
socket.emit('join-project', {
  projectId: 'proj-123',
  userId: 'user-123',
  email: 'user@example.com',
});

// Listen for user joined
socket.on('user-joined', (data) => {
  console.log('Users in project:', data.users);
});

// Send tree update
socket.emit('tree-update', {
  projectId: 'proj-123',
  tree: { ... },
});

// Listen for tree updates from others
socket.on('tree-updated', (data) => {
  console.log('Updated by:', data.updatedBy);
  updateUI(data.tree);
});

// Add comment
socket.emit('add-comment', {
  projectId: 'proj-123',
  comment: 'Let\'s add a utils folder here',
  path: 'src/components',
});

// Listen for comments
socket.on('comment-added', (data) => {
  console.log(`${data.by}: ${data.comment}`);
});
```

