const fs = require('node:fs');
const path = require('node:path');
const { v4: uuid } = require('uuid');

const CONFIG = require('../config/default.json');
const DATA_DIR = path.resolve(CONFIG.storage.dir);
const DELETED_DIR = path.join(DATA_DIR, 'deleted');

function init() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(DELETED_DIR, { recursive: true });
}

function filePath(id) {
  return path.join(DATA_DIR, `${id}.md`);
}

function deletedFilePath(id) {
  return path.join(DELETED_DIR, `${id}.md`);
}

// ── Caching ──────────────────────────────────────────────────────────────────
// Conversations are stored as markdown on disk, and a single chat turn used to
// read and re-parse the same file four times. The hot paths (get/list/search)
// all re-read the whole corpus on every request. Everything below is keyed on
// (mtimeMs, size) so a stat() replaces the read whenever a file actually
// changed, and a file written through this module invalidates its own entry.
//
// Both caches are byte-budgeted rather than entry-counted: search() touches
// every conversation at once, so a small entry limit would thrash and help
// nobody.

const CACHE_BUDGET_BYTES = 64 * 1024 * 1024;

// Raw file text. Used by get(), which must return a fresh parsed object every
// time because callers mutate the result.
const textCache = new Map();
let textCacheBytes = 0;

// Parsed conversations. ONLY safe for read-only consumers (search()) — never
// hand one of these to a caller that might mutate it.
const convCache = new Map();
let convCacheBytes = 0;

function cacheEvict(cache, key, budget) {
  const prev = cache.get(key);
  if (prev) {
    budget.n -= prev.bytes;
    cache.delete(key);
  }
}

function cacheSet(cache, key, entry, budget) {
  cacheEvict(cache, key, budget);
  cache.set(key, entry);
  budget.n += entry.bytes;
  while (budget.n > CACHE_BUDGET_BYTES && cache.size > 1) {
    const oldest = cache.keys().next().value;
    budget.n -= cache.get(oldest).bytes;
    cache.delete(oldest);
  }
}

const textBudget = { get n() { return textCacheBytes; }, set n(v) { textCacheBytes = v; } };
const convBudget = { get n() { return convCacheBytes; }, set n(v) { convCacheBytes = v; } };

function readText(fp) {
  let st;
  try {
    st = fs.statSync(fp);
  } catch {
    cacheEvict(textCache, fp, textBudget);
    cacheEvict(convCache, fp, convBudget);
    return null;
  }
  const hit = textCache.get(fp);
  if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) return hit.text;
  let text;
  try {
    text = fs.readFileSync(fp, 'utf-8');
  } catch {
    return null;
  }
  cacheSet(textCache, fp, { mtimeMs: st.mtimeMs, size: st.size, text, bytes: text.length * 2 }, textBudget);
  return text;
}

// Read-only parse, safe to cache and reuse. Do not mutate the result.
function readConvCached(fp, isJson) {
  let st;
  try {
    st = fs.statSync(fp);
  } catch {
    cacheEvict(textCache, fp, textBudget);
    cacheEvict(convCache, fp, convBudget);
    return null;
  }
  const hit = convCache.get(fp);
  if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) return hit.conv;
  const text = readText(fp);
  if (text === null) return null;
  let conv;
  try {
    conv = isJson ? convFromJson(fp) : parseConversationMarkdown(text);
  } catch {
    return null;
  }
  const bytes = text.length * 2;
  cacheSet(convCache, fp, { mtimeMs: st.mtimeMs, size: st.size, conv, bytes }, convBudget);
  return conv;
}

function invalidate(fp) {
  if (!fp) return;
  cacheEvict(textCache, fp, textBudget);
  cacheEvict(convCache, fp, convBudget);
}

// Summary cache for list()/listDeleted(): these only need header metadata plus
// a message count, but computing it means parsing the whole file.
const SUMMARY_CACHE_MAX = 512;
const summaryCache = new Map(); // filepath -> { mtimeMs, size, summary }

function readSummary(fp, summarize) {
  let st;
  try {
    st = fs.statSync(fp);
  } catch {
    summaryCache.delete(fp);
    return null;
  }
  const hit = summaryCache.get(fp);
  if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) return hit.summary;
  let summary;
  try {
    summary = summarize(readText(fp));
  } catch {
    return null; // corrupt file
  }
  if (summary) {
    summaryCache.set(fp, { mtimeMs: st.mtimeMs, size: st.size, summary });
    if (summaryCache.size > SUMMARY_CACHE_MAX) {
      summaryCache.delete(summaryCache.keys().next().value);
    }
  }
  return summary;
}

// Drop cached entries whose files no longer exist, so a long-lived process
// doesn't hold text for deleted conversations.
function pruneCaches(dir, live) {
  for (const key of textCache.keys()) {
    if (path.dirname(key) === dir && !live.has(path.basename(key))) cacheEvict(textCache, key, textBudget);
  }
  for (const key of convCache.keys()) {
    if (path.dirname(key) === dir && !live.has(path.basename(key))) cacheEvict(convCache, key, convBudget);
  }
  for (const key of summaryCache.keys()) {
    if (path.dirname(key) === dir && !live.has(path.basename(key))) summaryCache.delete(key);
  }
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
    autoTitle: Boolean(raw.autoTitle),
    pinned: Boolean(raw.pinned),
    customPrompt: raw.customPrompt || '',
    mode: raw.mode || 'chat',
    workdir: raw.workdir || '',
    messages: raw.messages || [],
    branches: Array.isArray(raw.branches) ? raw.branches : [],
    activeBranchId: raw.activeBranchId || '',
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    deletedAt: raw.deletedAt || '',
    retentionDays: Number(raw.retentionDays) || 0,
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
  lines.push(`- **AutoTitle:** ${conv.autoTitle ? 'true' : 'false'}`);
  lines.push(`- **Pinned:** ${conv.pinned ? 'true' : 'false'}`);
  lines.push(`- **Mode:** ${conv.mode === 'agent' ? 'agent' : 'chat'}`);
  if (conv.workdir) lines.push(`- **Workdir:** ${conv.workdir}`);
  if (conv.deletedAt) lines.push(`- **Deleted:** ${conv.deletedAt}`);
  if (conv.retentionDays) lines.push(`- **RetentionDays:** ${conv.retentionDays}`);
  if (conv.customPrompt) lines.push(`- **Prompt:** ${JSON.stringify(conv.customPrompt)}`);
  if (Array.isArray(conv.branches) && conv.branches.length) {
    const branchData = Buffer.from(JSON.stringify({
      activeBranchId: conv.activeBranchId,
      branches: conv.branches,
    }), 'utf8').toString('base64');
    lines.push(`<!-- vanilla-branches:${branchData} -->`);
  }
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

function parseConversationMarkdown(text) {
  const lines = text.split('\n');

  const conv = {
    id: '',
    title: '',
    model: '',
    autoTitle: false,
    pinned: false,
    customPrompt: '',
    mode: 'chat',
    workdir: '',
    messages: [],
    branches: [],
    activeBranchId: '',
    createdAt: '',
    updatedAt: '',
    deletedAt: '',
    retentionDays: 0,
  };

  let mode = 'header';
  let currentMsg = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (mode === 'header') {
      const branchesMatch = line.match(/^<!-- vanilla-branches:([A-Za-z0-9+/=]+) -->$/);
      if (branchesMatch) {
        try {
          const data = JSON.parse(Buffer.from(branchesMatch[1], 'base64').toString('utf8'));
          conv.branches = Array.isArray(data.branches) ? data.branches : [];
          conv.activeBranchId = data.activeBranchId || '';
        } catch {
          conv.branches = [];
          conv.activeBranchId = '';
        }
        continue;
      }

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
        else if (key === 'Deleted') conv.deletedAt = val;
        else if (key === 'RetentionDays') conv.retentionDays = Number(val) || 0;
        else if (key === 'AutoTitle') conv.autoTitle = val === 'true';
        else if (key === 'Pinned') conv.pinned = val === 'true';
        else if (key === 'Mode') conv.mode = val === 'agent' ? 'agent' : 'chat';
        else if (key === 'Workdir') conv.workdir = val;
        else if (key === 'Prompt') {
          try {
            conv.customPrompt = JSON.parse(val);
          } catch {
            conv.customPrompt = val;
          }
        }
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
        if (currentMsg) {
          currentMsg.content = currentMsg.content.replace(/\n+$/, '');
          conv.messages.push(currentMsg);
        }
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
        // Skip empty lines immediately after message header
        if (currentMsg.content === '' && line.trim() === '') {
          continue;
        }
        
        if (currentMsg.content === '') {
          currentMsg.content = line;
        } else {
          currentMsg.content += '\n' + line;
        }
      }
    }
  }

  if (currentMsg) {
    // Trim trailing newlines/whitespace from the last message
    currentMsg.content = currentMsg.content.replace(/\n+$/, '');
    conv.messages.push(currentMsg);
  }

  return conv;
}

function convFromMarkdown(fp) {
  const text = readText(fp);
  return text === null ? null : parseConversationMarkdown(text);
}

function importConversations(files) {
  const created = [];
  for (const file of files || []) {
    const content = file?.content || '';
    if (!content || !content.trim()) continue;
    let conv;
    try {
      if (content.trim().startsWith('{')) {
        const raw = JSON.parse(content);
        conv = {
          id: raw.id || '',
          title: raw.title || '',
          model: raw.model || '',
          provider: raw.provider || undefined,
          autoTitle: Boolean(raw.autoTitle),
          pinned: Boolean(raw.pinned),
          customPrompt: raw.customPrompt || '',
          mode: raw.mode === 'agent' ? 'agent' : 'chat',
          workdir: raw.workdir || '',
          messages: raw.messages || [],
          branches: Array.isArray(raw.branches) ? raw.branches : [],
          activeBranchId: raw.activeBranchId || '',
          createdAt: raw.createdAt || '',
          updatedAt: raw.updatedAt || '',
        };
      } else {
        conv = parseConversationMarkdown(content);
      }
    } catch {
      continue;
    }

    if (!conv.id) conv.id = uuid();
    if (!conv.title) conv.title = (file.name || 'Imported chat').replace(/\.(md|markdown|json)$/i, '').trim() || 'Imported chat';
    if (!conv.createdAt) conv.createdAt = new Date().toISOString();
    if (!conv.updatedAt) conv.updatedAt = conv.createdAt;
    if (!conv.model) conv.model = '';
    conv.autoTitle = Boolean(conv.autoTitle);
    conv.pinned = Boolean(conv.pinned);
    conv.customPrompt = conv.customPrompt || '';
    conv.mode = conv.mode === 'agent' ? 'agent' : 'chat';
    conv.workdir = conv.workdir || '';
    conv.messages = Array.isArray(conv.messages) ? conv.messages : [];
    conv.branches = Array.isArray(conv.branches) ? conv.branches : [];
    conv.activeBranchId = conv.activeBranchId || '';

    fs.writeFileSync(filePath(conv.id), convToMarkdown(conv));
    created.push({
      id: conv.id,
      title: conv.title,
      model: conv.model,
      provider: conv.provider,
      autoTitle: conv.autoTitle,
      pinned: conv.pinned,
      messageCount: conv.messages.length,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    });
  }
  return created;
}

function list(mode = '') {
  let files;
  try {
    files = fs.readdirSync(DATA_DIR);
  } catch {
    return [];
  }
  const convs = [];
  const live = new Set();

  for (const f of files) {
    if (!isJsonFile(f) && !isMdFile(f)) continue;
    const fp = path.join(DATA_DIR, f);
    live.add(f);

    const summarize = (text) => {
      if (text === null) return null;
      const conv = isJsonFile(f) ? convFromJson(fp) : parseConversationMarkdown(text);
      return {
        id: conv.id,
        title: conv.title,
        model: conv.model,
        provider: conv.provider,
        autoTitle: conv.autoTitle,
        pinned: Boolean(conv.pinned),
        mode: conv.mode || 'chat',
        workdir: conv.workdir || '',
        messageCount: conv.messages.length,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    };

    const summary = readSummary(fp, summarize);
    if (!summary) continue;
    if (mode && (summary.mode || 'chat') !== mode) continue;
    convs.push(summary);
  }

  pruneCaches(DATA_DIR, live);

  return convs.sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
}

function create(title = 'New Conversation', model = 'llama2', provider, { autoTitle, mode, workdir } = {}) {
  const id = uuid();
  const now = new Date().toISOString();
  const conv = {
    id,
    title,
    model,
    autoTitle: Boolean(autoTitle),
    mode: mode === 'agent' ? 'agent' : 'chat',
    workdir: workdir || '',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  if (provider) conv.provider = provider;
  const fp = filePath(id);
  fs.writeFileSync(fp, convToMarkdown(conv));
  invalidate(fp);
  return conv;
}

function get(id) {
  const mdPath = filePath(id);
  const jsonPath = path.join(DATA_DIR, `${id}.json`);

  // Try the markdown file first; fall back to a legacy .json on ENOENT rather
  // than stat()ing both paths up front.
  const text = readText(mdPath);
  if (text !== null) return normalizeBranches(parseConversationMarkdown(text));

  let conv;
  try {
    conv = convFromJson(jsonPath);
  } catch {
    return null;
  }
  // migrate to markdown
  fs.writeFileSync(mdPath, convToMarkdown(conv));
  invalidate(mdPath);
  try {
    fs.unlinkSync(jsonPath);
  } catch {}
  return normalizeBranches(conv);
}

function normalizeBranches(conv) {
  if (!conv) return conv;
  if (!Array.isArray(conv.branches)) conv.branches = [];
  if (conv.branches.length && !conv.branches.some((branch) => branch.id === conv.activeBranchId)) {
    conv.activeBranchId = conv.branches[conv.branches.length - 1].id;
  }
  const active = conv.branches.find((branch) => branch.id === conv.activeBranchId);
  if (active) conv.messages = active.messages;
  return conv;
}

function ensureRootBranch(conv) {
  normalizeBranches(conv);
  if (conv.branches.length) return conv;
  const root = {
    id: uuid(),
    parentId: null,
    label: 'Original',
    createdAt: conv.createdAt || new Date().toISOString(),
    messages: JSON.parse(JSON.stringify(conv.messages || [])),
  };
  conv.branches = [root];
  conv.activeBranchId = root.id;
  conv.messages = root.messages;
  return conv;
}

function update(conv) {
  normalizeBranches(conv);
  const active = conv.branches?.find((branch) => branch.id === conv.activeBranchId);
  if (active) active.messages = conv.messages;
  conv.updatedAt = new Date().toISOString();
  const fp = filePath(conv.id);
  fs.writeFileSync(fp, convToMarkdown(conv));
  invalidate(fp);
  summaryCache.delete(fp);
  return conv;
}

function remove(id) {
  const mdPath = filePath(id);
  const jsonPath = path.join(DATA_DIR, `${id}.json`);
  // unlink and treat ENOENT as success: one syscall instead of stat+unlink,
  // and no TOCTOU window between the check and the delete.
  for (const fp of [mdPath, jsonPath]) {
    try {
      fs.unlinkSync(fp);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    invalidate(fp);
    summaryCache.delete(fp);
  }
}

// Move a conversation into the "recently deleted" folder. While it sits there
// it is fully recoverable until the retention window expires.
function softDelete(id, retentionDays) {
  const conv = get(id);
  if (!conv) return null;

  conv.deletedAt = new Date().toISOString();
  conv.retentionDays = Number(retentionDays) || 0;

  fs.writeFileSync(deletedFilePath(id), convToMarkdown(conv));
  invalidate(deletedFilePath(id));
  remove(id);
  return {
    id: conv.id,
    title: conv.title,
    deletedAt: conv.deletedAt,
    retentionDays: conv.retentionDays,
  };
}

function getDeleted(id) {
  return convFromMarkdown(deletedFilePath(id));
}

function daysUntilExpiry(conv, fallbackDays) {
  const retentionDays = Number(conv.retentionDays) || Number(fallbackDays) || 0;
  const deletedAt = conv.deletedAt ? new Date(conv.deletedAt).getTime() : Date.now();
  const expiresAt = deletedAt + retentionDays * 86400000;
  const remainingMs = expiresAt - Date.now();
  return {
    retentionDays,
    expiresAt: new Date(expiresAt).toISOString(),
    daysRemaining: Math.max(0, Math.ceil(remainingMs / 86400000)),
  };
}

function listDeleted(mode, fallbackDays) {
  const convs = [];
  let files;
  try {
    files = fs.readdirSync(DELETED_DIR);
  } catch {
    return convs;
  }
  const live = new Set();

  for (const f of files) {
    if (!isJsonFile(f) && !isMdFile(f)) continue;
    const fp = path.join(DELETED_DIR, f);
    live.add(f);

    const summary = readSummary(fp, (text) => {
      if (text === null) return null;
      const conv = isJsonFile(f) ? convFromJson(fp) : parseConversationMarkdown(text);
      const expiry = daysUntilExpiry(conv, fallbackDays);
      return {
        id: conv.id,
        title: conv.title,
        model: conv.model,
        provider: conv.provider,
        messageCount: conv.messages.length,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        deletedAt: conv.deletedAt,
        retentionDays: expiry.retentionDays,
        expiresAt: expiry.expiresAt,
        daysRemaining: expiry.daysRemaining,
      };
    });
    if (!summary) continue;
    if (mode && (summary.mode || 'chat') !== mode) continue;
    convs.push(summary);
  }

  pruneCaches(DELETED_DIR, live);

  return convs.sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0));
}

function restore(id) {
  const conv = getDeleted(id);
  if (!conv) return null;

  conv.deletedAt = '';
  conv.retentionDays = 0;
  const fp = filePath(id);
  fs.writeFileSync(fp, convToMarkdown(conv));
  invalidate(fp);
  summaryCache.delete(fp);
  try {
    fs.unlinkSync(deletedFilePath(id));
  } catch {}
  invalidate(deletedFilePath(id));
  summaryCache.delete(deletedFilePath(id));
  return conv;
}

// Remove a conversation for good: from the deleted folder when present,
// otherwise straight from the live data folder.
function permanentDelete(id) {
  const deletedPath = deletedFilePath(id);
  try {
    fs.unlinkSync(deletedPath);
    invalidate(deletedPath);
    summaryCache.delete(deletedPath);
    return true;
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  const hadLive = readText(filePath(id)) !== null || readText(path.join(DATA_DIR, `${id}.json`)) !== null;
  remove(id);
  return hadLive;
}

// Delete any conversations whose retention window has already passed.
function purgeExpired(fallbackDays) {
  let purged = 0;
  let files;
  try {
    files = fs.readdirSync(DELETED_DIR);
  } catch {
    return purged;
  }

  for (const f of files) {
    if (!isJsonFile(f) && !isMdFile(f)) continue;
    const fp = path.join(DELETED_DIR, f);
    try {
      let conv;
      if (isJsonFile(f)) conv = convFromJson(fp);
      else {
        const text = readText(fp);
        if (text === null) continue;
        conv = parseConversationMarkdown(text);
      }

      const expiry = daysUntilExpiry(conv, fallbackDays);
      if (expiry.daysRemaining <= 0) {
        fs.unlinkSync(fp);
        invalidate(fp);
        summaryCache.delete(fp);
        purged++;
      }
    } catch {
      // skip corrupt files
    }
  }
  return purged;
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

function branchFromUserMessage(id, messageId, content) {
  const conv = get(id);
  if (!conv) return null;
  ensureRootBranch(conv);
  let msgIndex = messageId ? conv.messages.findIndex((message) => message.id === messageId) : -1;
  if (msgIndex < 0) {
    for (let i = conv.messages.length - 1; i >= 0; i--) {
      if (conv.messages[i].role === 'user') { msgIndex = i; break; }
    }
  }
  if (msgIndex < 0 || conv.messages[msgIndex].role !== 'user') return conv;

  const messages = JSON.parse(JSON.stringify(conv.messages.slice(0, msgIndex + 1)));
  messages[msgIndex] = {
    ...messages[msgIndex],
    id: uuid(),
    content,
    timestamp: new Date().toISOString(),
  };
  const branch = {
    id: uuid(),
    parentId: conv.activeBranchId,
    label: `Edit ${conv.branches.length}`,
    createdAt: new Date().toISOString(),
    forkedFromMessageId: messageId || conv.messages[msgIndex].id,
    messages,
  };
  conv.branches.push(branch);
  conv.activeBranchId = branch.id;
  conv.messages = branch.messages;
  return update(conv);
}

function switchBranch(id, branchId) {
  const conv = get(id);
  if (!conv) return null;
  ensureRootBranch(conv);
  const branch = conv.branches.find((entry) => entry.id === branchId);
  if (!branch) return false;
  conv.activeBranchId = branch.id;
  conv.messages = branch.messages;
  return update(conv);
}

const WORD_RADIUS = 8;

// Check if query matches text as a substring or word boundary
function smartMatch(query, text) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  
  // First check for exact substring match
  if (t.includes(q)) return true;
  
  // Check for word boundary match (query starts with a word in the text)
  const words = t.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(q)) return true;
  }
  
  return false;
}

function findExactMatch(query, text, lowered) {
  const idx = (lowered ?? text.toLowerCase()).indexOf(query);
  if (idx === -1) return null;
  return { start: idx, end: idx + query.length, exact: true };
}

function findTightFuzzySpan(query, text) {
  const q = query;
  const t = text;
  
  // Try to find sequential match within a reasonable span
  // This looks for all characters in order, but close together
  let bestStart = -1;
  let bestLen = Infinity;
  const maxGap = Math.max(3, Math.floor(q.length * 0.5)); // Allow small gaps

  for (let start = 0; start < t.length; start++) {
    if (t[start] !== q[0]) continue;
    let qi = 1;
    let end = start + 1;
    let gaps = 0;
    
    while (qi < q.length && end < t.length) {
      if (t[end] === q[qi]) {
        qi++;
        gaps = 0; // Reset gap counter on match
      } else {
        gaps++;
        // If gap is too large, this isn't a good match
        if (gaps > maxGap) break;
      }
      end++;
    }
    
    // Only count it as a match if we found all characters
    // and the span is reasonable (not scattered across the whole text)
    if (qi === q.length && (end - start) < bestLen && (end - start) < q.length * 4) {
      bestStart = start;
      bestLen = end - start;
    }
  }

  if (bestStart === -1) return null;
  return { start: bestStart, end: bestStart + bestLen, exact: false };
}

// A fuzzy match can only succeed if every one of its characters appears in the
// text, so require a few of them up front. This replaces what used to be a full
// O(len(query) x len(message)) scan of every non-exact-matching message with a
// handful of indexOf calls.
function couldFuzzyMatch(query, lowered) {
  const q = query;
  // Sample distinct characters from across the query, not just the prefix —
  // a message missing any of them cannot match.
  const seen = new Set();
  const probes = [];
  for (let i = 0; i < q.length && probes.length < 3; i++) {
    const ch = q[i];
    if (ch === ' ' || seen.has(ch)) continue;
    seen.add(ch);
    probes.push(ch);
  }
  for (const ch of probes) {
    if (!lowered.includes(ch)) return false;
  }
  return true;
}

function extractFuzzyTerm(text, spanStart, spanEnd) {
  const slice = text.slice(spanStart, spanEnd);
  const words = slice.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0];

  const before = text.slice(0, spanStart);
  const beforeWord = before.match(/(\w+)\s*$/);
  const after = text.slice(spanEnd);
  const afterWord = after.match(/^\s*(\w+)/);

  const parts = [];
  if (beforeWord && /^[a-zA-Z]/.test(slice[0])) parts.push(beforeWord[1]);
  parts.push(words[0]);
  if (afterWord) parts.push(afterWord[1]);
  return parts.join(' ');
}

function buildSnippet(text, matchStart, matchEnd) {
  // Walk outward from the match to find the ±WORD_RADIUS word boundaries. The
  // previous implementation tokenized the entire message, which meant
  // allocating a word array for every candidate match.
  const isSpace = (ch) => ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r';

  // Start of the word the match begins in.
  let wordStart = Math.max(0, Math.min(matchStart, text.length));
  while (wordStart > 0 && !isSpace(text[wordStart - 1])) wordStart--;

  let lo = wordStart;
  for (let i = 0; i < WORD_RADIUS && lo > 0; i++) {
    let p = lo - 1;
    while (p >= 0 && isSpace(text[p])) p--;
    if (p < 0) { lo = 0; break; }
    while (p >= 0 && !isSpace(text[p])) p--;
    lo = p + 1;
  }

  // End of the word the match ends in, then forward.
  let wordEnd = Math.max(wordStart, Math.min(matchEnd, text.length));
  while (wordEnd < text.length && !isSpace(text[wordEnd])) wordEnd++;

  let hi = wordEnd;
  for (let i = 0; i < WORD_RADIUS && hi < text.length; i++) {
    let p = hi;
    while (p < text.length && isSpace(text[p])) p++;
    if (p >= text.length) { hi = text.length; break; }
    while (p < text.length && !isSpace(text[p])) p++;
    hi = p;
  }

  const snippet = text.slice(lo, hi);
  const before = text.slice(0, lo).trim();
  const after = text.slice(hi).trim();
  return (before ? '…' : '') + snippet + (after ? '…' : '');
}

function search(query, mode = '') {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  let files;
  try {
    files = fs.readdirSync(DATA_DIR);
  } catch {
    return [];
  }
  const results = [];
  const live = new Set();

  for (const f of files) {
    if (!isJsonFile(f) && !isMdFile(f)) continue;
    const fp = path.join(DATA_DIR, f);
    live.add(f);
    try {
      // readConvCached is read-only; nothing below mutates the conversation.
      const conv = readConvCached(fp, isJsonFile(f));
      if (!conv) continue;
      if (mode && (conv.mode || 'chat') !== mode) continue;

      const matches = [];

      // Check title with smart matching
      if (smartMatch(q, conv.title)) {
        const matchPos = findExactMatch(q, conv.title);
        if (matchPos) {
          matches.push({ 
            type: 'title',
            matchStart: matchPos.start,
            matchEnd: matchPos.end
          });
        } else {
          matches.push({ type: 'title' });
        }
      }

      // Check messages
      for (const msg of conv.messages) {
        if (!msg.content) continue;
        // Lowercase once per message instead of once per matcher.
        const lowered = msg.content.toLowerCase();

        let matchPos = findExactMatch(q, msg.content, lowered);
        let hasExactMatch = !!matchPos;

        if (!matchPos && couldFuzzyMatch(q, lowered)) {
          matchPos = findTightFuzzySpan(q, lowered);
        }

        if (matchPos && matches.length < 4) {
          const snippet = buildSnippet(msg.content, matchPos.start, matchPos.end);
          const entry = {
            type: 'content',
            messageId: msg.id,
            role: msg.role,
            snippet,
            matchStart: matchPos.start,
            matchEnd: matchPos.end,
            query: q
          };
          if (hasExactMatch) entry.term = q;
          matches.push(entry);
        }
      }

      if (matches.length) {
        results.push({ id: conv.id, title: conv.title, matches });
      }
    } catch {
      // skip corrupt files
    }
  }

  pruneCaches(DATA_DIR, live);
  return results;
}

module.exports = { init, list, create, get, update, remove, softDelete, listDeleted, getDeleted, restore, permanentDelete, purgeExpired, addMessage, eraseLastAssistant, branchFromUserMessage, switchBranch, importConversations, search, DATA_DIR };
