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
  return parseConversationMarkdown(fs.readFileSync(fp, 'utf-8'));
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
        autoTitle: conv.autoTitle,
        pinned: Boolean(conv.pinned),
        messageCount: conv.messages.length,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      });
    } catch {
      // skip corrupt files
    }
  }

  return convs.sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
}

function create(title = 'New Conversation', model = 'llama2', provider, { autoTitle } = {}) {
  const id = uuid();
  const now = new Date().toISOString();
  const conv = { id, title, model, autoTitle: Boolean(autoTitle), messages: [], createdAt: now, updatedAt: now };
  if (provider) conv.provider = provider;
  fs.writeFileSync(filePath(id), convToMarkdown(conv));
  return conv;
}

function get(id) {
  const mdPath = filePath(id);
  const jsonPath = path.join(DATA_DIR, `${id}.json`);

  if (fs.existsSync(mdPath)) {
    return normalizeBranches(convFromMarkdown(mdPath));
  }
  if (fs.existsSync(jsonPath)) {
    const conv = convFromJson(jsonPath);
    // migrate to markdown
    fs.writeFileSync(mdPath, convToMarkdown(conv));
    fs.unlinkSync(jsonPath);
    return normalizeBranches(conv);
  }
  return null;
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
  fs.writeFileSync(filePath(conv.id), convToMarkdown(conv));
  return conv;
}

function remove(id) {
  const mdPath = filePath(id);
  const jsonPath = path.join(DATA_DIR, `${id}.json`);
  if (fs.existsSync(mdPath)) fs.unlinkSync(mdPath);
  if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
}

// Move a conversation into the "recently deleted" folder. While it sits there
// it is fully recoverable until the retention window expires.
function softDelete(id, retentionDays) {
  const conv = get(id);
  if (!conv) return null;

  conv.deletedAt = new Date().toISOString();
  conv.retentionDays = Number(retentionDays) || 0;

  fs.writeFileSync(deletedFilePath(id), convToMarkdown(conv));
  remove(id);
  return {
    id: conv.id,
    title: conv.title,
    deletedAt: conv.deletedAt,
    retentionDays: conv.retentionDays,
  };
}

function getDeleted(id) {
  const mdPath = deletedFilePath(id);
  if (fs.existsSync(mdPath)) return convFromMarkdown(mdPath);
  return null;
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

function listDeleted(fallbackDays) {
  const convs = [];
  if (!fs.existsSync(DELETED_DIR)) return convs;

  for (const f of fs.readdirSync(DELETED_DIR)) {
    const fp = path.join(DELETED_DIR, f);
    try {
      let conv;
      if (isJsonFile(f)) conv = convFromJson(fp);
      else if (isMdFile(f)) conv = convFromMarkdown(fp);
      else continue;

      const expiry = daysUntilExpiry(conv, fallbackDays);
      convs.push({
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
      });
    } catch {
      // skip corrupt files
    }
  }

  return convs.sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0));
}

function restore(id) {
  const conv = getDeleted(id);
  if (!conv) return null;

  conv.deletedAt = '';
  conv.retentionDays = 0;
  fs.writeFileSync(filePath(id), convToMarkdown(conv));
  fs.unlinkSync(deletedFilePath(id));
  return conv;
}

// Remove a conversation for good: from the deleted folder when present,
// otherwise straight from the live data folder.
function permanentDelete(id) {
  const deletedPath = deletedFilePath(id);
  if (fs.existsSync(deletedPath)) {
    fs.unlinkSync(deletedPath);
    return true;
  }
  const hadLive = fs.existsSync(filePath(id)) || fs.existsSync(path.join(DATA_DIR, `${id}.json`));
  remove(id);
  return hadLive;
}

// Delete any conversations whose retention window has already passed.
function purgeExpired(fallbackDays) {
  let purged = 0;
  if (!fs.existsSync(DELETED_DIR)) return purged;

  for (const f of fs.readdirSync(DELETED_DIR)) {
    const fp = path.join(DELETED_DIR, f);
    try {
      let conv;
      if (isJsonFile(f)) conv = convFromJson(fp);
      else if (isMdFile(f)) conv = convFromMarkdown(fp);
      else continue;

      const expiry = daysUntilExpiry(conv, fallbackDays);
      if (expiry.daysRemaining <= 0) {
        fs.unlinkSync(fp);
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

function findExactMatch(query, text) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return null;
  return { start: idx, end: idx + query.length, exact: true };
}

function findTightFuzzySpan(query, text) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  
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
  const wordRegex = /\S+\s*/g;
  const wordPositions = [];
  let m;
  while ((m = wordRegex.exec(text)) !== null) {
    wordPositions.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  }
  if (!wordPositions.length) return text.slice(Math.max(0, matchStart - 40), matchEnd + 40);

  let matchIdx = -1;
  for (let i = 0; i < wordPositions.length; i++) {
    const w = wordPositions[i];
    if (matchStart >= w.start && matchEnd <= w.end) { matchIdx = i; break; }
  }
  if (matchIdx === -1) {
    for (let i = 0; i < wordPositions.length; i++) {
      if (matchStart >= wordPositions[i].start && matchStart < wordPositions[i].end) { matchIdx = i; break; }
    }
  }

  let start = 0;
  let end = wordPositions.length;
  if (matchIdx !== -1) {
    start = Math.max(0, matchIdx - WORD_RADIUS);
    end = Math.min(wordPositions.length, matchIdx + 1 + WORD_RADIUS);
  }

  const before = wordPositions.slice(0, start).map((w) => w.text).join('');
  const center = wordPositions.slice(start, end).map((w) => w.text).join('');
  const after = wordPositions.slice(end).map((w) => w.text).join('');

  let snippet = center;
  if (before.trim()) snippet = '…' + snippet;
  if (after.trim()) snippet = snippet + '…';
  return snippet;
}

function search(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim();
  const files = fs.readdirSync(DATA_DIR);
  const results = [];

  for (const f of files) {
    const fp = path.join(DATA_DIR, f);
    try {
      let conv;
      if (isJsonFile(f)) conv = convFromJson(fp);
      else if (isMdFile(f)) conv = convFromMarkdown(fp);
      else continue;

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

        let matchPos = findExactMatch(q, msg.content);
        let hasExactMatch = !!matchPos;

        if (!matchPos) {
          matchPos = findTightFuzzySpan(q, msg.content);
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

  return results;
}

module.exports = { init, list, create, get, update, remove, softDelete, listDeleted, getDeleted, restore, permanentDelete, purgeExpired, addMessage, eraseLastAssistant, branchFromUserMessage, switchBranch, importConversations, search, DATA_DIR };
