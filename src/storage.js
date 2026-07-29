const fs = require('node:fs');
const path = require('node:path');
const { v4: uuid } = require('uuid');

const CONFIG = require('../config/default.json');
const DATA_DIR = path.resolve(CONFIG.storage.dir);

function init() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function filePath(id) {
  return path.join(DATA_DIR, `${id}.json`);
}

function list() {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  return files
    .map((f) => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'));
        return {
          id: data.id,
          title: data.title,
          model: data.model,
          messageCount: data.messages.length,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function create(title = 'New Conversation', model = 'llama2') {
  const id = uuid();
  const now = new Date().toISOString();
  const conv = { id, title, model, messages: [], createdAt: now, updatedAt: now };
  fs.writeFileSync(filePath(id), JSON.stringify(conv, null, 2));
  return conv;
}

function get(id) {
  const fp = filePath(id);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

function update(conv) {
  conv.updatedAt = new Date().toISOString();
  fs.writeFileSync(filePath(conv.id), JSON.stringify(conv, null, 2));
  return conv;
}

function remove(id) {
  const fp = filePath(id);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

function addMessage(id, role, content, model) {
  const conv = get(id);
  if (!conv) return null;
  const msg = { id: uuid(), role, content, timestamp: new Date().toISOString() };
  if (model) msg.model = model;
  conv.messages.push(msg);
  return update(conv);
}

module.exports = { init, list, create, get, update, remove, addMessage };
