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
    autoTitle: Boolean(raw.autoTitle),
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
  lines.push(`- **AutoTitle:** ${conv.autoTitle ? 'true' : 'false'}`);
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
    autoTitle: false,
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
        else if (key === 'AutoTitle') conv.autoTitle = val === 'true';
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

function replaceUserMessageAndTruncate(id, messageId, content) {
  const conv = get(id);
  if (!conv) return null;
  
  // If messageId not provided, find the last user message
  if (!messageId) {
    for (let i = conv.messages.length - 1; i >= 0; i--) {
      if (conv.messages[i].role === 'user') {
        conv.messages[i].content = content;
        conv.messages[i].timestamp = new Date().toISOString();
        // Remove all messages after this one
        conv.messages.splice(i + 1);
        return update(conv);
      }
    }
    return conv;
  }
  
  // Find the message to replace by ID
  const msgIndex = conv.messages.findIndex(m => m.id === messageId);
  if (msgIndex === -1) {
    // Message ID not found, fall back to replacing last user message
    return replaceUserMessageAndTruncate(id, null, content);
  }
  
  // Update the message content
  conv.messages[msgIndex].content = content;
  conv.messages[msgIndex].timestamp = new Date().toISOString();
  
  // Remove all messages after this one (including any assistant responses and further exchanges)
  conv.messages.splice(msgIndex + 1);
  
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

module.exports = { init, list, create, get, update, remove, addMessage, eraseLastAssistant, replaceLastUserMessage: replaceUserMessageAndTruncate, search, DATA_DIR };
