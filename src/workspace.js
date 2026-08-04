const fs = require('node:fs');
const path = require('node:path');

const WORKSPACE_DIR = path.join(__dirname, '..', 'data', 'workspace');

function ensureDir() {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

function resolveSafe(rel) {
  ensureDir();
  const root = path.resolve(WORKSPACE_DIR);
  const target = path.resolve(root, String(rel || ''));
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error('Path escapes the workspace directory');
  }
  return target;
}

function toRel(abs) {
  return path.relative(WORKSPACE_DIR, abs).split(path.sep).join('/');
}

function isEnabled() {
  return fs.existsSync(WORKSPACE_DIR);
}

function listFiles() {
  ensureDir();
  const out = [];
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.name === '.git') continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else {
        const st = fs.statSync(abs);
        out.push({ path: toRel(abs), size: st.size, mtime: st.mtimeMs });
      }
    }
  };
  walk(WORKSPACE_DIR);
  return out;
}

function writeFile(rel, content) {
  const abs = resolveSafe(rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const data = String(content ?? '');
  fs.writeFileSync(abs, data);
  return { path: toRel(abs), size: Buffer.byteLength(data) };
}

function deleteFile(rel) {
  const abs = resolveSafe(rel);
  if (!fs.existsSync(abs)) throw new Error('File not found');
  const st = fs.statSync(abs);
  if (st.isDirectory()) throw new Error('Is a directory');
  fs.rmSync(abs);
  return { path: toRel(abs) };
}

function readFile(rel, maxBytes = 200000) {
  const abs = resolveSafe(rel);
  if (!fs.existsSync(abs)) throw new Error('File not found');
  const st = fs.statSync(abs);
  if (st.isDirectory()) throw new Error('Is a directory');
  const buf = fs.readFileSync(abs);
  if (buf.length > maxBytes) {
    return { path: toRel(abs), size: buf.length, truncated: true, content: buf.slice(0, maxBytes).toString('utf8') };
  }
  return { path: toRel(abs), size: buf.length, truncated: false, content: buf.toString('utf8') };
}

module.exports = { WORKSPACE_DIR, isEnabled, listFiles, writeFile, deleteFile, readFile };
