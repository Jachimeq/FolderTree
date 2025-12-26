const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const { generateFoldersFromTree } = require("./createFoldersFromTree");
const { classifyWithOpenAI } = require("./classifier");
const { ensureInsideBase, normalizeIndentTree, parseIndentTree, flattenOps, applyOps } = require("./fsOps");
const { generateStructure } = require("./aiGenerate");

// Load env from backend/api.env if present (keeps your current workflow),
// otherwise fallback to default .env resolution.
const apiEnvPath = path.join(__dirname, "api.env");
if (fs.existsSync(apiEnvPath)) {
  dotenv.config({ path: apiEnvPath });
} else {
  dotenv.config();
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

function requireApiKey(req, res, next) {
  const required = process.env.API_KEY;
  if (!required) return next();
  const got = req.headers["x-api-key"];
  if (got !== required) return res.status(401).json({ error: "Unauthorized" });
  next();
}

function normalizeTreePayload(body) {
  if (!body) return null;
  if (body.tree && body.tree.items && body.tree.rootId) return body.tree;
  if (body.items && body.rootId) return body;
  return null;
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, name: "FolderTreePRO backend", time: new Date().toISOString() });
});

// Existing: create folders/files from internal tree object (drag&drop UI)
app.post("/api/create-folders", requireApiKey, (req, res) => {
  try {
    const tree = normalizeTreePayload(req.body);
    if (!tree) {
      return res
        .status(400)
        .json({ error: "Invalid tree payload. Expected { tree } or tree object with items/rootId." });
    }

    const overwriteFiles = !!req.body?.overwriteFiles;
    const createFiles = req.body?.createFiles !== false;
    const outDir = generateFoldersFromTree(tree, { overwriteFiles, createFiles });
    return res.json({ success: true, output: outDir });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
});

// New: preview ops from pasted tree text (plain or markdown)
app.post("/api/preview", requireApiKey, (req, res) => {
  try {
    const { text, outputDir } = req.body || {};
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Missing 'text' string in body." });
    }

    const lines = normalizeIndentTree(text);
    const parsed = parseIndentTree(lines);

    const base = outputDir || process.env.DEFAULT_OUTPUT_DIR || path.join(__dirname, "generated");
    const allowedBase = process.env.ALLOWED_OUTPUT_BASE;
    const safeBase = allowedBase ? ensureInsideBase(base, allowedBase) : path.resolve(base);

    const ops = flattenOps(parsed, safeBase);
    return res.json({ outputDir: safeBase, ops, count: ops.length });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Preview failed" });
  }
});

// New: apply ops from pasted tree text (safe, optional overwrite)
app.post("/api/apply", requireApiKey, (req, res) => {
  try {
    const { text, outputDir, overwriteFiles } = req.body || {};
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Missing 'text' string in body." });
    }

    const lines = normalizeIndentTree(text);
    const parsed = parseIndentTree(lines);

    const base = outputDir || process.env.DEFAULT_OUTPUT_DIR || path.join(__dirname, "generated");
    const allowedBase = process.env.ALLOWED_OUTPUT_BASE;
    const safeBase = allowedBase ? ensureInsideBase(base, allowedBase) : path.resolve(base);

    const ops = flattenOps(parsed, safeBase);
    applyOps(ops, { overwriteFiles: !!overwriteFiles });

    return res.json({ success: true, outputDir: safeBase, created: ops.length });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Apply failed" });
  }
});

// New: AI generate plain-text tree using selected provider (ollama/openai)
app.post("/api/ai/generate", requireApiKey, async (req, res) => {
  try {
    const { prompt, provider, model } = req.body || {};
    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Missing 'prompt' string in body." });
    }
    const text = await generateStructure({ prompt, provider, model });
    return res.json({ text });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "AI generate failed" });
  }
});

app.post("/api/classify", requireApiKey, async (req, res) => {
  try {
    const { title } = req.body || {};
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Missing 'title' string in body." });
    }

    const result = await classifyWithOpenAI(title);
    return res.json({ category: result.category, confidence: result.confidence, source: result.source });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Classification failed" });
  }
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
