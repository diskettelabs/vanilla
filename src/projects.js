const fs = require('node:fs');
const path = require('node:path');
const workspace = require('./workspace');

const PROJECTS_FILE = path.resolve('data', 'projects.json');
const MAX_PROJECTS = 25;

function load() {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function save(list) {
  fs.mkdirSync(path.dirname(PROJECTS_FILE), { recursive: true });
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(list, null, 2));
}

function list() {
  return load().map((p, index) => ({
    index,
    name: p.name || path.basename(p.dir || ''),
    dir: p.dir,
    exists: fs.existsSync(p.dir),
  }));
}

function add(dirArg) {
  const resolved = workspace.resolveRoot(dirArg);
  const current = load();
  const clean = current.map((p) => ({ name: p.name, dir: p.dir }));
  if (!clean.some((p) => p.dir === resolved)) {
    clean.unshift({ name: path.basename(resolved), dir: resolved });
    if (clean.length > MAX_PROJECTS) clean.length = MAX_PROJECTS;
  }
  save(clean);
  return list();
}

function remove(index) {
  const current = load();
  if (!Number.isInteger(index) || index < 0 || index >= current.length) {
    throw new Error('Invalid project index');
  }
  current.splice(index, 1);
  save(current);
  return list();
}

module.exports = { list, add, remove };