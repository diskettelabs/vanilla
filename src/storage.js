const fs = require('node:fs');
const path = require('node:path');
const { v4: uuid } = require('uuid');

const CONFIG = require('../config/default.json');
const DATA_DIR = path.resolve(CONFIG.storage.dir);

function init() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function filePath(id) {
  return path.join(DATA_DIR, `${id}.md`);
}

function isJsonFile(name) {
  return name.endsWith('.json') && name !== '.gitkeep';
}

function isMdFile(name) {
  return name.endsWith('.md') && name !== '.gitkeep';
}

function convFromJson(fp) {
  const raw = JSON.parse(fs.readFileSync(fp, 'utf-8'));
  return {
    id: raw.id,
    title: raw.title || 'Untitled',
    model: raw.model || '',
    provider: raw.provider || undefined,
    messages: raw.messages || [],
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

function convToMarkdown(conv) {
  const lines = [];
  lines.push(`# ${conv.title}`);
  lines.push('');
  lines.push(`- **ID:** ${conv.id}`);
  lines.push(`- **Model:** ${conv.model || ''}`);
  if (conv.provider) lines.push(`- **Provider:** ${conv.provider}`);
  lines.push(`- **Created:** ${conv.createdAt}`);
  lines.push(`- **Updated:** ${conv.updatedAt}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const msg of conv.messages) {
    const modelTag = msg.model ? ` model:${msg.model}` : '';
    lines.push(`## ${msg.role} \`${msg.id}\` @ ${msg.timestamp}${modelTag}`);
    lines.push('');
    lines.push(msg.content);
    lines.push('');
  }

  return lines.join('\n');
}

function convFromMarkdown(fp) {
  const text = fs.readFileSync(fp, 'utf-8');
  const lines = text.split('\n');

  const conv = {
    id: '',
    title: '',
    model: '',
    messages: [],
    createdAt: '',
    updatedAt: '',
  };

  let mode = 'header';
  let currentMsg = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (mode === 'header') {
      const titleMatch = line.match(/^#\s+(.+)/);
      if (titleMatch) {
        conv.title = titleMatch[1].trim();
        continue;
      }

      const metaMatch = line.match(/^-\s+\*\*(\w+):\*\*\s+(.*)/);
      if (metaMatch) {
        const key = metaMatch[1];
        const val = metaMatch[2].trim();
        if (key === 'ID') conv.id = val;
        else if (key === 'Model') conv.model = val;
        else if (key === 'Provider') conv.provider = val;
        else if (key === 'Created') conv.createdAt = val;
        else if (key === 'Updated') conv.updatedAt = val;
        continue;
      }

      if (line.trim() === '---') {
        mode = 'messages';
      }
      continue;
    }

    if (mode === 'messages') {
      const msgMatch = line.match(
        /^##\s+(\w+)\s+`([\w-]+)`\s+@\s+(\S+)(?:\s+model:(\S+))?$/
      );
      if (msgMatch) {
        if (currentMsg) conv.messages.push(currentMsg);
        currentMsg = {
          id: msgMatch[2],
          role: msgMatch[1],
          content: '',
          timestamp: msgMatch[3],
        };
        if (msgMatch[4]) currentMsg.model = msgMatch[4];
        continue;
      }

      if (currentMsg) {
        if (currentMsg.content === '') {
          currentMsg.content = line;
        } else {
          currentMsg.content += '\n' + line;
        }
      }
    }
  }

  if (currentMsg) conv.messages.push(currentMsg);

  return conv;
}

function list() {
  const files = fs.readdirSync(DATA_DIR);
  const convs = [];

  for (const f of files) {
    const fp = path.join(DATA_DIR, f);
    try {
      let conv;
      if (isJsonFile(f)) {
        conv = convFromJson(fp);
      } else if (isMdFile(f)) {
        conv = convFromMarkdown(fp);
      } else {
        continue;
      }
      convs.push({
        id: conv.id,
        title: conv.title,
        model: conv.model,
        provider: conv.provider,
        messageCount: conv.messages.length,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      });
    } catch {
      // skip corrupt files
    }
  }

  return convs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function create(title = 'New Conversation', model = 'llama2', provider) {
  const id = uuid();
  const now = new Date().toISOString();
  const conv = { id, title, model, messages: [], createdAt: now, updatedAt: now };
  if (provider) conv.provider = provider;
  fs.writeFileSync(filePath(id), convToMarkdown(conv));
  return conv;
}

function get(id) {
  const mdPath = filePath(id);
  const jsonPath = path.join(DATA_DIR, `${id}.json`);

  if (fs.existsSync(mdPath)) {
    return convFromMarkdown(mdPath);
  }
  if (fs.existsSync(jsonPath)) {
    const conv = convFromJson(jsonPath);
    // migrate to markdown
    fs.writeFileSync(mdPath, convToMarkdown(conv));
    fs.unlinkSync(jsonPath);
    return conv;
  }
  return null;
}

function update(conv) {
  conv.updatedAt = new Date().toISOString();
  fs.writeFileSync(filePath(conv.id), convToMarkdown(conv));
  return conv;
}

function remove(id) {
  const mdPath = filePath(id);
  const jsonPath = path.join(DATA_DIR, `${id}.json`);
  if (fs.existsSync(mdPath)) fs.unlinkSync(mdPath);
  if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
}

function addMessage(id, role, content, model) {
  const conv = get(id);
  if (!conv) return null;
  const msg = { id: uuid(), role, content, timestamp: new Date().toISOString() };
  if (model) msg.model = model;
  conv.messages.push(msg);
  return update(conv);
}

function eraseLastAssistant(id) {
  const conv = get(id);
  if (!conv) return null;
  for (let i = conv.messages.length - 1; i >= 0; i--) {
    if (conv.messages[i].role === 'assistant') {
      conv.messages.splice(i, 1);
      return update(conv);
    }
  }
  return conv;
}

function replaceLastUserMessage(id, content) {
  const conv = get(id);
  if (!conv) return null;
  for (let i = conv.messages.length - 1; i >= 0; i--) {
    if (conv.messages[i].role === 'user') {
      conv.messages[i].content = content;
      conv.messages[i].timestamp = new Date().toISOString();
      return update(conv);
    }
  }
  return conv;
}

module.exports = { init, list, create, get, update, remove, addMessage, eraseLastAssistant, replaceLastUserMessage };
