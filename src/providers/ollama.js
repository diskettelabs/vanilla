const { request } = require('node:http');
const { Provider } = require('./base');

class OllamaProvider extends Provider {
  static label = 'Ollama (Local)';

  constructor(config) {
    super(config);
    this.host = config.host || 'http://localhost:11434';
    this.timeout = config.requestTimeout || 30000;
  }

  async listModels() {
    const data = await this._request('/api/tags');
    return (data.models || []).map((m) => ({ name: m.name, size: m.size }));
  }

  async listChatModels() {
    const data = await this._request('/api/tags');
    return (data.models || []).map((m) => m.name);
  }

  async chatStream(messages, model, onToken, onDone, onError, { signal } = {}) {
    const url = new URL('/api/chat', this.host);
    const body = JSON.stringify({ model, messages, stream: true });

    return new Promise((resolve, reject) => {
      const req = request(
        url,
        { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          timeout: 0  // No timeout - streaming can take a long time
        },
        (res) => {
          let buffer = '';
          const onAbort = () => {
            req.destroy();
            const e = new Error('Stream aborted by user');
            onError(e);
            reject(e);
          };
          if (signal) {
            if (signal.aborted) { onAbort(); return; }
            signal.addEventListener('abort', onAbort, { once: true });
          }
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
      req.write(body);
      req.end();
    });
  }

  _request(path, options = {}) {
    const url = new URL(path, this.host);
    return new Promise((resolve, reject) => {
      const req = request(
        url,
        {
          method: options.method || 'GET',
          headers: { 'Content-Type': 'application/json', ...options.headers },
          timeout: this.timeout,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
              return reject(new Error(`Ollama returned ${res.statusCode}`));
            }
            try {
              resolve(JSON.parse(data));
            } catch {
              reject(new Error('Invalid JSON from Ollama'));
            }
          });
        }
      );
      req.on('error', (e) => reject(new Error(`Connection failed: ${e.message}`)));
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
      if (options.body) req.write(JSON.stringify(options.body));
      req.end();
    });
  }
}

module.exports = { OllamaProvider };
