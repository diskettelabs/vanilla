'use strict';

const http = require('node:http');
const https = require('node:https');

const CONFIG = require('../config/default.json');
const OLLAMA_HOST = (CONFIG.providers && CONFIG.providers.ollama && CONFIG.providers.ollama.host) || 'http://localhost:11434';

// Curated list of well-known models from the Ollama library. There is no public
// JSON search API for ollama.com, so we ship a curated catalog and let users
// pull any model name directly (Ollama resolves it from its registry).
const LIBRARY = [
  // General purpose
  { id: 'llama3.2:3b', name: 'Llama 3.2', tags: ['general', 'small'], size: '2.0 GB', desc: 'Meta\'s fast, capable 3B model. Great all-rounder for everyday chat.' },
  { id: 'llama3.2:1b', name: 'Llama 3.2 1B', tags: ['general', 'small'], size: '1.3 GB', desc: 'Tiny Llama for quick answers on modest hardware.' },
  { id: 'llama3.3:70b', name: 'Llama 3.3 70B', tags: ['general', 'large'], size: '40 GB', desc: 'Meta\'s flagship 70B instruct model. High quality, needs a beefy machine.' },
  { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B', tags: ['general'], size: '4.7 GB', desc: 'Alibaba\'s strong generalist with good multilingual skills.' },
  { id: 'qwen3:8b', name: 'Qwen3 8B', tags: ['general'], size: '5.2 GB', desc: 'Latest Qwen generation, reasoning-capable.' },
  { id: 'qwen2.5:0.5b', name: 'Qwen 2.5 0.5B', tags: ['general', 'small'], size: '398 MB', desc: 'Ultra-tiny model used for auto-naming chats.' },
  { id: 'gemma3:12b', name: 'Gemma 3 12B', tags: ['general'], size: '8.1 GB', desc: 'Google\'s open multimodal model, strong at instruction following.' },
  { id: 'gemma3:4b', name: 'Gemma 3 4B', tags: ['general'], size: '3.3 GB', desc: 'Lightweight Gemma for laptops.' },
  { id: 'mistral:7b', name: 'Mistral 7B', tags: ['general'], size: '4.4 GB', desc: 'The classic French 7B, efficient and solid.' },
  { id: 'phi4:14b', name: 'Phi-4 14B', tags: ['general', 'reasoning'], size: '9.1 GB', desc: 'Microsoft\'s math-and-reasoning focused 14B.' },
  { id: 'gpt-oss:20b', name: 'GPT-OSS 20B', tags: ['general', 'reasoning'], size: '12 GB', desc: 'OpenAI\'s open-weight model with strong reasoning.' },
  { id: 'deepseek-r1:14b', name: 'DeepSeek R1 14B', tags: ['reasoning'], size: '9.0 GB', desc: 'Reasoning model that shows its thinking.' },
  { id: 'deepseek-r1:7b', name: 'DeepSeek R1 7B', tags: ['reasoning'], size: '4.7 GB', desc: 'Compact reasoning model.' },
  // Coding
  { id: 'qwen2.5-coder:7b', name: 'Qwen2.5 Coder 7B', tags: ['coding'], size: '4.7 GB', desc: 'Specialized coding model, great for autocomplete and edits.' },
  { id: 'qwen2.5-coder:14b', name: 'Qwen2.5 Coder 14B', tags: ['coding'], size: '9.0 GB', desc: 'Bigger coding model for harder programming tasks.' },
  { id: 'qwen2.5-coder:32b', name: 'Qwen2.5 Coder 32B', tags: ['coding'], size: '19 GB', desc: 'Top-tier open coding model.' },
  { id: 'codellama:7b', name: 'Code Llama 7B', tags: ['coding'], size: '3.8 GB', desc: 'Meta\'s original code-focused Llama.' },
  // Vision (image input, text output)
  { id: 'llama3.2-vision:11b', name: 'Llama 3.2 Vision 11B', tags: ['vision'], size: '7.9 GB', desc: 'Understands images and answers questions about them.' },
  { id: 'llava:13b', name: 'LLaVA 13B', tags: ['vision'], size: '9.1 GB', desc: 'The classic open vision-language model.' },
  { id: 'qwen2.5-vl:7b', name: 'Qwen2.5-VL 7B', tags: ['vision'], size: '5.7 GB', desc: 'Alibaba\'s vision-language model.' },
  // Image generation (experimental, macOS)
  { id: 'x/z-image-turbo', name: 'Z-Image Turbo', tags: ['image-gen', 'experimental'], size: '13 GB', desc: 'Text-to-image generation (experimental). Photorealistic with bilingual text.' },
  { id: 'x/flux2-klein', name: 'FLUX.2 Klein', tags: ['image-gen', 'experimental'], size: '5.7 GB', desc: 'Fast text-to-image generation (experimental). Great with text/typography.' },
  // Embeddings
  { id: 'nomic-embed-text', name: 'Nomic Embed Text', tags: ['embedding'], size: '274 MB', desc: 'Embedding model for search and RAG.' },
  { id: 'mxbai-embed-large', name: 'MXBAI Embed Large', tags: ['embedding'], size: '670 MB', desc: 'High-quality general-purpose embeddings.' },
  { id: 'all-minilm', name: 'All-MiniLM', tags: ['embedding', 'small'], size: '46 MB', desc: 'Tiny, fast embeddings.' },
];

const TAG_NAMES = new Map([
  ['general', 'General'],
  ['reasoning', 'Reasoning'],
  ['coding', 'Coding'],
  ['vision', 'Vision'],
  ['image-gen', 'Image generation'],
  ['embedding', 'Embeddings'],
  ['small', 'Small'],
  ['large', 'Large'],
  ['experimental', 'Experimental'],
]);

function request(host, urlPath, { method = 'GET', body, timeout = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(urlPath, host || OLLAMA_HOST);
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

async function listInstalled(host) {
  try {
    const { status, data } = await request(host, '/api/tags', { timeout: 15000 });
    if (status < 200 || status >= 300) return [];
    const parsed = JSON.parse(data);
    return (parsed.models || []).map((m) => m.name);
  } catch {
    return [];
  }
}

async function searchLibrary(q) {
  const query = String(q || '').trim().toLowerCase();
  if (!query) return LIBRARY.map((m) => ({ ...m }));
  const tokens = query.split(/\s+/);
  return LIBRARY.filter((m) => {
    const haystack = `${m.id} ${m.name} ${m.desc} ${(m.tags || []).join(' ')}`.toLowerCase();
    return tokens.every((t) => haystack.includes(t));
  }).map((m) => ({ ...m }));
}

function pullModel(host, model) {
  const queue = [];
  const waiters = [];
  let finished = false;
  let failure = null;

  const enqueue = (evt) => {
    if (waiters.length) waiters.shift()(evt);
    else queue.push(evt);
  };

  const waitNext = () => new Promise((resolve) => {
    if (queue.length) resolve(queue.shift());
    else waiters.push(resolve);
  });

  return (async function* pull() {
    await new Promise((resolveStream) => {
      const target = new URL('/api/pull', host || OLLAMA_HOST);
      const mod = target.protocol === 'http:' ? http : https;
      const req = mod.request(
        target,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify({ model })),
          },
        },
        (res) => {
          let buffer = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              let evt;
              try {
                evt = JSON.parse(trimmed);
              } catch {
                continue;
              }
              if (evt.error) {
                failure = new Error(evt.error);
                finished = true;
                resolveStream();
                return;
              }
              enqueue(evt);
            }
          });
          res.on('end', () => {
            finished = true;
            resolveStream();
          });
          res.on('error', (e) => {
            failure = e;
            finished = true;
            resolveStream();
          });
        }
      );
      req.setTimeout(600000, () => req.destroy(new Error('Ollama pull timed out')));
      req.on('error', (e) => {
        failure = e;
        finished = true;
        resolveStream();
      });
      req.write(JSON.stringify({ model }));
      req.end();
    });

    for (;;) {
      if (queue.length) {
        yield queue.shift();
        continue;
      }
      if (finished) {
        if (failure) throw failure;
        return;
      }
      yield await waitNext();
    }
  })();
}

module.exports = { LIBRARY, TAG_NAMES, listInstalled, searchLibrary, pullModel, OLLAMA_HOST };
