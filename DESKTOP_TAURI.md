# FolderTreePRO Desktop (Tauri)

## Requirements (Windows)
- Node.js (LTS)
- Rust toolchain (stable) + MSVC build tools
  - Install: https://www.rust-lang.org/tools/install
  - Ensure you have 'Desktop development with C++' in Visual Studio Build Tools

## Run desktop in dev
From repo root:
1) Install dependencies
   npm install
2) Start desktop (runs Vite + Tauri)
   npm run desktop:dev

## Build installer
1) (Optional) set env for desktop API base url
   Copy frontend/.env.desktop to frontend/.env (or set env var in your shell):
   VITE_API_BASE_URL=http://localhost:3001/api
2) Build
   npm run desktop:build

## Backend
Desktop UI talks to backend over HTTP:
- Default: http://localhost:3001/api
You can run backend in another terminal:
  npm run dev:backend

### Tip
If you want a single EXE that also starts backend automatically, we can add a Tauri sidecar (next step).
