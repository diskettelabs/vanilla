const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');

// Resolve relative to cwd: in the packaged app gelectron chdir()s to the user
// data dir, so this lands in Vanilla's Application Support data directory.
// instead of the read-only app bundle.
const WORKSPACE_DIR = path.resolve('data', 'workspace');

// Directories skipped when browsing a project, so giant dependency trees
// (node_modules, .git, build output...) never flood the agent sidebar.
const HEAVY_DIRS = new Set([
  'node_modules', '.git', '.hg', '.svn', 'dist', 'build', 'out', 'target',
  '.next', '.nuxt', '.output', '.venv', 'venv', 'env', '.env', '.cache',
  '__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache', '.turbo',
]);
const SKIP_FILES = new Set(['.DS_Store', 'Thumbs.db', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']);

function resolveRoot(root) {
  if (!root || typeof root !== 'string' || !root.trim()) return WORKSPACE_DIR;
  const resolved = path.resolve(root.trim());
  let st;
  try {
    st = fs.statSync(resolved);
  } catch {
    throw new Error(`Directory not found: ${resolved}`);
  }
  if (!st.isDirectory()) throw new Error(`Directory not found: ${resolved}`);
  return resolved;
}

const ensuredDirs = new Set();

function ensureDir(root = WORKSPACE_DIR) {
  if (ensuredDirs.has(root)) return;
  fs.mkdirSync(root, { recursive: true });
  ensuredDirs.add(root);
}

function resolveSafe(rel, root = WORKSPACE_DIR) {
  ensureDir(root);
  const base = path.resolve(root);
  const target = path.resolve(base, String(rel || ''));
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new Error('Path escapes the working directory');
  }
  return target;
}

function toRel(abs, root = WORKSPACE_DIR) {
  return path.relative(path.resolve(root), abs).split(path.sep).join('/');
}

function isEnabled() {
  return fs.existsSync(WORKSPACE_DIR);
}

// Recursive listing used by the list_workspace_files tool and GET /api/workspace.
// Skips dependency/build directories and caps the result — walking node_modules
// used to mean tens of thousands of synchronous stat calls per request.
function listFiles(root = WORKSPACE_DIR, { skipHeavy = true, maxFiles = 600 } = {}) {
  root = resolveRoot(root);
  ensureDir(root);
  const out = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.name === '.git') continue;
      if (skipHeavy && entry.isDirectory() && HEAVY_DIRS.has(entry.name)) continue;
      if (SKIP_FILES.has(entry.name)) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else {
        let st;
        try {
          st = fs.statSync(abs);
        } catch {
          continue;
        }
        out.push({ path: toRel(abs, root), size: st.size, mtime: st.mtimeMs });
        if (out.length >= maxFiles) return;
      }
    }
  };
  walk(root);
  return out;
}

function writeFile(rel, content, root = WORKSPACE_DIR) {
  root = resolveRoot(root);
  const abs = resolveSafe(rel, root);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const data = String(content ?? '');
  fs.writeFileSync(abs, data);
  return { path: toRel(abs, root), size: Buffer.byteLength(data) };
}

// Single stat() instead of existsSync() + statSync(), which both halves the
// syscalls and closes the check-then-act race.
function statFile(abs) {
  let st;
  try {
    st = fs.statSync(abs);
  } catch {
    throw new Error('File not found');
  }
  if (st.isDirectory()) throw new Error('Is a directory');
  return st;
}

function deleteFile(rel, root = WORKSPACE_DIR) {
  root = resolveRoot(root);
  const abs = resolveSafe(rel, root);
  statFile(abs);
  fs.rmSync(abs);
  return { path: toRel(abs, root) };
}

function readFile(rel, maxBytes = 200000, root = WORKSPACE_DIR) {
  root = resolveRoot(root);
  const abs = resolveSafe(rel, root);
  statFile(abs);
  const buf = fs.readFileSync(abs);
  if (buf.length > maxBytes) {
    return { path: toRel(abs, root), size: buf.length, truncated: true, content: buf.slice(0, maxBytes).toString('utf8') };
  }
  return { path: toRel(abs, root), size: buf.length, truncated: false, content: buf.toString('utf8') };
}

function openFolder() {
  ensureDir();
  const cmd =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
  return new Promise((resolve, reject) => {
    execFile(cmd, [WORKSPACE_DIR], { timeout: 10000 }, (err) => {
      if (err) return reject(new Error(`Could not open the folder: ${err.message}`));
      resolve({ path: WORKSPACE_DIR });
    });
  });
}

function listDirEntries(dir, { skipHeavy = true } = {}) {
  const abs = path.resolve(dir);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    throw new Error(`Directory not found: ${abs}`);
  }
  const entries = fs
    .readdirSync(abs, { withFileTypes: true })
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .filter((entry) => {
      if (entry.name === '.git') return false;
      if (skipHeavy && entry.isDirectory() && HEAVY_DIRS.has(entry.name)) return false;
      if (SKIP_FILES.has(entry.name)) return false;
      return true;
    });
  const out = [];
  for (const entry of entries) {
    const full = path.join(abs, entry.name);
    let st;
    try {
      st = fs.statSync(full);
    } catch {
      continue;
    }
    out.push({
      name: entry.name,
      type: entry.isDirectory() ? 'dir' : 'file',
      size: entry.isDirectory() ? null : st.size,
      mtime: st.mtimeMs,
    });
  }
  return out;
}

function listFilesFlat(root = WORKSPACE_DIR, { skipHeavy = true, maxFiles = 600 } = {}) {
  root = resolveRoot(root);
  const out = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === '.git') continue;
      if (skipHeavy && entry.isDirectory() && HEAVY_DIRS.has(entry.name)) continue;
      if (SKIP_FILES.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        let st;
        try {
          st = fs.statSync(full);
        } catch {
          continue;
        }
        out.push({ path: toRel(full, root), size: st.size, mtime: st.mtimeMs });
        if (out.length >= maxFiles) return;
      }
    }
  };
  walk(root);
  return out;
}

module.exports = { WORKSPACE_DIR, resolveRoot, isEnabled, listFiles, writeFile, deleteFile, readFile, openFolder, listDirEntries, listFilesFlat };
