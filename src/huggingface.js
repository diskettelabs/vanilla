const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const HF_API = 'https://huggingface.co/api';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

function _request(url, { headers = {}, method = 'GET', redirects = 0 } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'http:' ? http : require('node:https');
    const req = mod.request(
      parsed,
      { method, headers: { 'User-Agent': 'vanilla-chat', ...headers } },
      (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume();
          if (redirects >= 5) return reject(new Error('Too many redirects'));
          return resolve(_request(new URL(res.headers.location, parsed).toString(), { headers, method, redirects: redirects + 1 }));
        }
        resolve(res);
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function _readJson(res) {
  return new Promise((resolve, reject) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HuggingFace API returned ${res.statusCode}: ${data.slice(0, 160)}`));
      }
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('Invalid JSON from HuggingFace'));
      }
    });
  });
}

function quantFromFilename(filename) {
  const stem = String(filename).replace(/\.gguf$/i, '');
  const m = stem.match(/(IQ[0-9]+(?:_[A-Z0-9]+)*|Q[0-9](?:_[A-Z0-9]+)*)/i);
  return m ? m[0].toUpperCase() : 'default';
}

function sanitizeRepo(repo) {
  return String(repo).replace(/[^a-zA-Z0-9._/:-]/g, '');
}

async function searchModels(query, limit = 24) {
  const q = String(query || '').trim();
  const url = q
    ? `${HF_API}/models?search=${encodeURIComponent(q)}&filter=gguf&limit=${limit}`
    : `${HF_API}/models?filter=gguf&sort=downloads&direction=-1&limit=${limit}`;
  console.log('[HF] Searching with URL:', url);
  const res = await _request(url);
  const data = await _readJson(res);
  console.log('[HF] Received', data?.length || 0, 'models from API');
  const filtered = (data || [])
    .filter((m) => !m.private)
    .map((m) => ({
      id: m.id,
      downloads: m.downloads || 0,
      likes: m.likes || 0,
      gated: Boolean(m.gated),
    }));
  console.log('[HF] Returning', filtered.length, 'models after filtering');
  return filtered;
}

async function listModelFiles(repo) {
  const url = `${HF_API}/models/${sanitizeRepo(repo)}/tree/main?recursive=true`;
  const res = await _request(url);
  const data = await _readJson(res);
  return (data || [])
    .filter((entry) => entry.type === 'file' && /\.gguf$/i.test(entry.path))
    .map((entry) => ({
      filename: entry.path,
      size: entry.size || 0,
      quant: quantFromFilename(entry.path),
    }))
    .sort((a, b) => a.size - b.size);
}

async function* downloadStream(url, destPath) {
  const res = await _request(url);
  if (res.statusCode < 200 || res.statusCode >= 300) {
    res.resume();
    throw new Error(`Download failed: HTTP ${res.statusCode}`);
  }
  const total = parseInt(res.headers['content-length'] || '0', 10);
  let downloaded = 0;
  let lastPct = -1;
  const out = fs.createWriteStream(destPath);
  for await (const chunk of res) {
    downloaded += chunk.length;
    if (!out.write(chunk)) {
      await new Promise((resolve) => out.once('drain', resolve));
    }
    if (total > 0) {
      const pct = Math.round((downloaded / total) * 100);
      if (pct !== lastPct) {
        lastPct = pct;
        yield { downloaded, total, pct };
      }
    }
  }
  await new Promise((resolve, reject) => {
    out.end((err) => (err ? reject(err) : resolve()));
  });
  if (total > 0 && downloaded !== total) {
    throw new Error(`Download incomplete (${downloaded}/${total} bytes)`);
  }
  yield { downloaded, total, pct: 100 };
}

async function* ollamaCreateStream(name, modelfile, { ollamaHost } = {}) {
  const body = JSON.stringify({ model: name, modelfile, stream: true });
  const parsed = new URL('/api/create', ollamaHost || OLLAMA_HOST);
  const mod = parsed.protocol === 'http:' ? http : require('node:https');
  const res = await new Promise((resolve, reject) => {
    const req = mod.request(
      parsed,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 60000,
      },
      (resolveResponse) => resolve(resolveResponse)
    );
    req.on('error', (e) => reject(new Error(`Ollama connection failed: ${e.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error('Ollama import timed out')); });
    req.write(body);
    req.end();
  });

  let buffer = '';
  for await (const chunk of res) {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      let parsedLine;
      try {
        parsedLine = JSON.parse(line);
      } catch {
        continue;
      }
      if (parsedLine.status === 'error') throw new Error(parsedLine.error || 'Ollama import failed');
      if (parsedLine.status) yield parsedLine.status;
      if (parsedLine.status === 'success') return;
    }
  }
  throw new Error('Ollama import ended without success');
}

async function ollamaRunning({ ollamaHost } = {}) {
  try {
    const res = await _request(`${ollamaHost || OLLAMA_HOST}/api/tags`);
    return res.statusCode >= 200 && res.statusCode < 300;
  } catch {
    return false;
  }
}

async function* installModel(repo, file, { ollamaHost } = {}) {
  const safeRepo = sanitizeRepo(repo);
  const safeFile = path.basename(String(file).replace(/\\/g, '/'));
  const quant = quantFromFilename(safeFile);
  const modelName = `${safeRepo}:${quant}`;
  const dlDir = path.join(process.cwd(), 'data', 'models', 'hf', safeRepo.replace(/[/:]/g, '_'));
  fs.mkdirSync(dlDir, { recursive: true });
  const filePath = path.join(dlDir, safeFile);

  if (!(await ollamaRunning({ ollamaHost }))) {
    throw new Error('Ollama is not running. Start the bundled Ollama (or run `ollama serve`) first.');
  }

  yield { type: 'status', message: `Downloading ${safeRepo}/${safeFile}` };
  for await (const progress of downloadStream(
    `https://huggingface.co/${safeRepo}/resolve/main/${encodeURIComponent(safeFile)}`,
    filePath
  )) {
    yield { type: 'progress', ...progress };
  }

  yield { type: 'status', message: 'Importing into Ollama…' };
  const modelfile = `FROM ${filePath}\n`;
  fs.writeFileSync(path.join(dlDir, 'Modelfile'), modelfile);

  for await (const status of ollamaCreateStream(modelName, modelfile, { ollamaHost })) {
    yield { type: 'status', message: status };
  }

  yield { type: 'done', model: modelName };
}

module.exports = { searchModels, listModelFiles, installModel, quantFromFilename };
