const http = require('node:http');
const https = require('node:https');

const PREFERRED = ['qwen2.5:0.5b', 'tinyllama:latest', 'llama3.2:1b', 'smollm2:360m'];
const DEFAULT_HOST = 'http://localhost:11434';

function request(host, urlPath, { method = 'GET', body, timeout = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(urlPath, host || DEFAULT_HOST);
    const mod = target.protocol === 'http:' ? http : https;
    const req = mod.request(
      target,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }
    );
    req.setTimeout(timeout, () => req.destroy(new Error('Ollama request timed out')));
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function listModels(host) {
  try {
    const { status, data } = await request(host, '/api/tags', { timeout: 15000 });
    if (status < 200 || status >= 300) return [];
    const parsed = JSON.parse(data);
    return (parsed.models || []).map((m) => ({ name: m.name, size: m.size || 0 }));
  } catch {
    return [];
  }
}

async function pullModel(host, model) {
  await request(host, '/api/pull', {
    method: 'POST',
    body: JSON.stringify({ model }),
    timeout: 300000,
  });
}

async function pickModel(host) {
  const models = await listModels(host);
  const names = new Set(models.map((m) => m.name));
  const installed = PREFERRED.find((m) => names.has(m));
  if (installed) return installed;
  try {
    await pullModel(host, 'qwen2.5:0.5b');
    return 'qwen2.5:0.5b';
  } catch {
    if (models.length) {
      models.sort((a, b) => a.size - b.size);
      return models[0].name;
    }
    return null;
  }
}

function excerpt(conv) {
  const userMsgs = (conv.messages || [])
    .filter((m) => m.role === 'user')
    .slice(-6)
    .map((m) => String(m.content || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return userMsgs.slice(-3).join(' ').slice(0, 1200);
}

function cleanTitle(raw) {
  let title = raw
    .replace(/^[#*>\-\s]+/, '')
    .replace(/["'`\u201c\u201d]+/g, '')
    .replace(/[.?!;:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  const words = title.split(' ');
  if (words.length > 6) title = words.slice(0, 6).join(' ');
  return title.slice(0, 60) || null;
}

async function ensureModel(host) {
  return pickModel(host);
}

async function generateTitle(conv, { host } = {}) {
  const model = await pickModel(host);
  const text = excerpt(conv);
  if (!model || !text) return null;

  const prompt = [
    'You are a chat naming assistant. From the conversation excerpt below, suggest a short title of at most 5 words that captures the topic.',
    'Reply with ONLY the title. No quotes, no period, no explanation.',
    '',
    text,
    '',
    'Title:',
  ].join('\n');

  const { status, data } = await request(host, '/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.6, num_predict: 24 },
    }),
  });
  if (status < 200 || status >= 300) return null;
  try {
    return cleanTitle(JSON.parse(data).response || '');
  } catch {
    return null;
  }
}

module.exports = { generateTitle, ensureModel };
