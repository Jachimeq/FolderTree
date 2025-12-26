const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "generated");

function isLikelyFile(name) {
  return /\.[a-z0-9]+$/i.test(name);
}

function safeMkdir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function createFromNode(tree, nodeId, basePath, { createFiles=true, overwriteFiles=false } = {}) {
  const node = tree.items[nodeId];
  const title = node.data.title;

  const currentPath = path.join(basePath, title);

  if (isLikelyFile(title)) {
    if (!createFiles) return;
    safeMkdir(path.dirname(currentPath));
    if (!overwriteFiles && fs.existsSync(currentPath)) return;
    fs.writeFileSync(currentPath, node.data.content || "", "utf-8");
    return;
  }

  safeMkdir(currentPath);

  for (const childId of node.children || []) {
    createFromNode(tree, childId, currentPath, { createFiles, overwriteFiles });
  }
}

function generateFoldersFromTree(tree, options = {}) {
  if (!fs.existsSync(OUTPUT_DIR)) safeMkdir(OUTPUT_DIR);
  createFromNode(tree, tree.rootId, OUTPUT_DIR, options);
  return OUTPUT_DIR;
}

module.exports = { generateFoldersFromTree };
