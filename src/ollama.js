const { request } = require('node:http');

const CONFIG = require('../config/default.json');

class OllamaError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'OllamaError';
    this.status = status;
  }
}

function ollamaRequest(path, options = {}) {
  const url = new URL(path, CONFIG.ollama.host);
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method: options.method || 'GET',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        timeout: CONFIG.ollama.requestTimeout,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new OllamaError(`Ollama returned ${res.statusCode}`, res.statusCode));
          }
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new OllamaError('Invalid JSON from Ollama'));
          }
        });
      }
    );
    req.on('error', (e) => reject(new OllamaError(`Connection failed: ${e.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new OllamaError('Request timed out')); });
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function listModels() {
  const data = await ollamaRequest('/api/tags');
  return (data.models || []).map((m) => ({ name: m.name, size: m.size }));
}

async function chatStream(messages, model, onToken, onDone, onError) {
  const url = new URL('/api/chat', CONFIG.ollama.host);
  const body = JSON.stringify({ model, messages, stream: true });

  return new Promise((resolve, reject) => {
    const req = request(
      url,
      { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      (res) => {
        let buffer = '';
        res.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              if (parsed.done) {
                onDone(parsed);
                resolve();
              } else if (parsed.message?.content) {
                onToken(parsed.message.content);
              }
            } catch {
              // skip malformed lines
            }
          }
        });
        res.on('end', () => {
          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer);
              if (parsed.done) onDone(parsed);
            } catch { /* ignore */ }
          }
          resolve();
        });
        res.on('error', (e) => { onError(e); reject(e); });
      }
    );
    req.on('error', (e) => { onError(e); reject(e); });
    req.on('timeout', () => {
      req.destroy();
      const e = new Error('Stream timed out');
      onError(e);
      reject(e);
    });
    req.write(body);
    req.end();
  });
}

module.exports = { listModels, chatStream, OllamaError };
