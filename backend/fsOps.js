const fs = require("fs");
const path = require("path");

function ensureInsideBase(targetPath, allowedBase) {
  const resolvedBase = path.resolve(allowedBase);
  const resolvedTarget = path.resolve(targetPath);
  if (!resolvedTarget.startsWith(resolvedBase + path.sep) && resolvedTarget !== resolvedBase) {
    throw new Error(`Refusing path outside allowed base. target=${resolvedTarget} base=${resolvedBase}`);
  }
  return resolvedTarget;
}

function normalizeIndentTree(text) {
  const lines = (text || "")
    .replace(/\t/g, "  ")
    .split(/\r?\n/)
    .map(l => l.replace(/\s+$/g, ""))
    .filter(l => l.trim().length > 0);

  // Detect markdown "- " format and convert to indentation
  const isMarkdown = lines.some(l => /^\s*-\s+/.test(l));
  if (isMarkdown) {
    // Convert "- name" to "  " * depth + name (depth inferred from leading spaces before '-')
    return lines.map(l => {
      const m = l.match(/^(\s*)-\s+(.*)$/);
      if (!m) return l;
      const lead = m[1].length;
      // assume 2 spaces per level in markdown indentation (common)
      const depth = Math.floor(lead / 2);
      return "  ".repeat(depth) + m[2];
    });
  }
  return lines;
}

function parseIndentTree(lines) {
  // Build a tree of nodes with children based on indentation (2 spaces per level)
  const root = { name: "__root__", children: [], type: "dir" };
  const stack = [{ indent: -1, node: root }];

  for (const raw of lines) {
    const indent = raw.match(/^\s*/)[0].length;
    const name = raw.trim();
    const type = /\.[a-z0-9]+$/i.test(name) ? "file" : "dir";

    // normalize to 2-space levels (still works with odd counts but may be off)
    const level = Math.floor(indent / 2);

    while (stack.length && stack[stack.length - 1].indent >= level) stack.pop();
    const parent = stack[stack.length - 1].node;

    const node = { name, type, children: [] };
    parent.children.push(node);
    stack.push({ indent: level, node });
  }
  return root;
}

function flattenOps(treeRoot, outputDir) {
  const ops = [];
  function walk(node, base) {
    for (const child of node.children) {
      const p = path.join(base, child.name);
      if (child.type === "dir") {
        ops.push({ op: "mkdir", path: p });
        walk(child, p);
      } else {
        ops.push({ op: "writeFile", path: p, bytes: 0 });
      }
    }
  }
  walk(treeRoot, outputDir);
  return ops;
}

function applyOps(ops, { overwriteFiles=false } = {}) {
  for (const op of ops) {
    if (op.op === "mkdir") {
      fs.mkdirSync(op.path, { recursive: true });
    } else if (op.op === "writeFile") {
      const dir = path.dirname(op.path);
      fs.mkdirSync(dir, { recursive: true });
      if (!overwriteFiles && fs.existsSync(op.path)) continue;
      fs.writeFileSync(op.path, op.content ?? "", "utf-8");
    }
  }
}

module.exports = {
  ensureInsideBase,
  normalizeIndentTree,
  parseIndentTree,
  flattenOps,
  applyOps,
};
