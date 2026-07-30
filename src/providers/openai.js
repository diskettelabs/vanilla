const { request } = require('node:https');
const { Provider } = require('./base');

class OpenAIProvider extends Provider {
  static label = 'OpenAI-Compatible';

  constructor(config) {
    super(config);
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || '';
    this.baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.timeout = config.requestTimeout || 60000;
    this.defaultModel = config.defaultModel || 'gpt-4o-mini';
    this._httpModule = this.baseUrl.startsWith('http://') ? require('node:http') : require('node:https');
  }

  async listModels() {
    if (!this.apiKey) return [];
    const data = await this._request('/models', { method: 'GET' });
    return (data.data || [])
      .filter((m) => m.id.startsWith('gpt') || m.id.startsWith('o'))
      .map((m) => ({ name: m.id, size: 0 }));
  }

  async listChatModels() {
    if (!this.apiKey) {
      return [this.defaultModel];
    }
    const data = await this._request('/models', { method: 'GET' });
    return (data.data || [])
      .filter((m) => m.id.startsWith('gpt') || m.id.startsWith('o'))
      .map((m) => m.id);
  }

  async chatStream(messages, model, onToken, onDone, onError, { signal } = {}) {
    const url = new URL('/chat/completions', this.baseUrl);
    const body = JSON.stringify({
      model: model || this.defaultModel,
      messages,
      stream: true,
    });

    return new Promise((resolve, reject) => {
      const req = this._httpModule.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
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
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const payload = trimmed.slice(6);
              if (payload === '[DONE]') {
                onDone();
                resolve();
                return;
              }
              try {
                const parsed = JSON.parse(payload);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) onToken(content);
                if (parsed.choices?.[0]?.finish_reason) {
                  onDone();
                  resolve();
                }
              } catch {
                // skip malformed lines
              }
            }
          });
          res.on('end', () => {
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

  _request(path, options = {}) {
    const url = new URL(path, this.baseUrl);
    return new Promise((resolve, reject) => {
      const req = this._httpModule.request(
        url,
        {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            ...options.headers,
          },
          timeout: this.timeout,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
              return reject(new Error(`API returned ${res.statusCode}: ${data.slice(0, 200)}`));
            }
            try {
              resolve(JSON.parse(data));
            } catch {
              reject(new Error('Invalid JSON response'));
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

module.exports = { OpenAIProvider };
