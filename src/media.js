'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { UPLOAD_DIR } = require('./upload');

const MARKER_RE = /\[(Image|Video):\s*(\/[^\]]+)\]/g;

const EXT_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
};

function mimeFor(file) {
  return EXT_MIME[path.extname(file).toLowerCase()] || null;
}

// Read an uploaded file (referenced as /uploads/<name>) and return
// { url, mime }. Returns null when the file is missing.
function readDataUri(url) {
  const name = path.basename(String(url || ''));
  if (!name || name === '.' || name === '..') return null;
  const abs = path.join(UPLOAD_DIR, name);
  let buf;
  try {
    buf = fs.readFileSync(abs);
  } catch {
    return null;
  }
  const mime = mimeFor(name) || 'application/octet-stream';
  return { url: `data:${mime};base64,${buf.toString('base64')}`, mime };
}

// Split a message string on [Image: url] / [Video: url] markers into
// { type: 'text'|'image'|'video', text?/url? } parts. Returns null when the
// string contains no markers.
function splitMedia(content) {
  if (typeof content !== 'string' || !MARKER_RE.test(content)) return null;
  MARKER_RE.lastIndex = 0;
  const items = [];
  let lastIndex = 0;
  let match;
  while ((match = MARKER_RE.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index);
    if (before.trim()) items.push({ type: 'text', text: before });
    items.push({ type: match[1].toLowerCase(), url: match[2] });
    lastIndex = match.index + match[0].length;
  }
  const after = content.slice(lastIndex);
  if (after.trim()) items.push({ type: 'text', text: after });
  return items.length ? items : null;
}

// Convert user messages containing media markers into OpenAI-style content
// arrays (text + image_url + video_url parts, media as base64 data URIs).
// Returns the same array unchanged when there is nothing to convert.
function toOpenAIContent(messages) {
  let changed = false;
  const out = messages.map((m) => {
    if (m.role !== 'user' || typeof m.content !== 'string') return m;
    const parts = splitMedia(m.content);
    if (!parts) return m;
    const content = [];
    for (const part of parts) {
      if (part.type === 'text') {
        content.push({ type: 'text', text: part.text });
        continue;
      }
      const file = readDataUri(part.url);
      const isImage = part.type === 'image' && file && file.mime.startsWith('image/');
      const isVideo = part.type === 'video' && file && file.mime.startsWith('video/');
      if (isImage) {
        content.push({ type: 'image_url', image_url: { url: file.url } });
      } else if (isVideo) {
        content.push({ type: 'video_url', video_url: { url: file.url } });
      } else {
        // Missing or mismatched file: keep the marker as plain text so the
        // model still gets context instead of a broken media part.
        content.push({ type: 'text', text: `[${part.type === 'image' ? 'Image' : 'Video'}: ${part.url}]` });
      }
    }
    if (!content.length || !content.some((c) => c.type !== 'text')) return m;
    changed = true;
    return { ...m, content };
  });
  return changed ? out : messages;
}

// Convert user messages containing image markers into Ollama's native format:
// { content, images: [rawBase64, ...] }. Video markers are kept as text since
// Ollama cannot process videos. Returns the same array when nothing converts.
function toOllamaMessages(messages) {
  let changed = false;
  const out = messages.map((m) => {
    if (m.role !== 'user' || typeof m.content !== 'string') return m;
    const parts = splitMedia(m.content);
    if (!parts) return m;
    const images = [];
    const text = [];
    let anyImage = false;
    for (const part of parts) {
      if (part.type === 'text') {
        text.push(part.text);
        continue;
      }
      const file = readDataUri(part.url);
      if (part.type === 'image' && file && file.mime.startsWith('image/')) {
        images.push(file.url.slice(file.url.indexOf(',') + 1));
        anyImage = true;
        continue;
      }
      text.push(`[${part.type === 'image' ? 'Image' : 'Video'}: ${part.url}]`);
    }
    if (!anyImage) return m;
    const content = text.join('\n').trim();
    const next = { ...m, content: content || '[image attached]' };
    if (images.length) next.images = images;
    changed = true;
    return next;
  });
  return changed ? out : messages;
}

module.exports = { toOpenAIContent, toOllamaMessages, splitMedia, readDataUri, mimeFor };
