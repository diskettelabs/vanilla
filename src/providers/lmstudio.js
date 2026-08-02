const { Provider } = require('./base');
const { ProviderError, NetworkError } = require('../errors');

class LMStudioError extends ProviderError {
  constructor(message, options = {}) {
    super('LM Studio', message, options);
  }
}

// LM Studio exposes an OpenAI-compatible API on http://localhost:1234/v1.
// No API key is required — the server is local.
class LMStudioProvider extends Provider {
  static label = 'LM Studio (Local)';

  constructor(config) {
    super(config);
    this.baseUrl = (config.baseUrl || 'http://localhost:1234/v1').replace(/\/+$/, '');
    this.apiKey = config.apiKey || '';
    this.timeout = config.requestTimeout || 120000;
    this.defaultModel = config.defaultModel || '';
    this._httpModule = this.baseUrl.startsWith('https://') ? require('node:https') : require('node:http');
  }

  hasConfiguredKey() {
    return true;
  }

  async listModels() {
    try {
      const data = await this._request('/models', { method: 'GET' });
      const models = (data.data || []).filter((m) => !this._isEmbedding(m.id));
      if (!models.length) {
        throw new LMStudioError('No models loaded', {
          userMessage: 'No models loaded in LM Studio',
          action: 'Load a model in LM Studio first (click the model picker at the top of the app, then select a model to load).',
          statusCode: 404,
        });
      }
      return models.map((m) => ({ name: m.id, size: 0 }));
    } catch (error) {
      if (error instanceof LMStudioError) throw error;
      throw this._enhanceError(error, 'list models');
    }
  }

  async listChatModels() {
    try {
      const data = await this._request('/models', { method: 'GET' });
      const models = (data.data || []).filter((m) => !this._isEmbedding(m.id));
      if (!models.length) {
        throw new LMStudioError('No models loaded', {
          userMessage: 'No models loaded in LM Studio',
          action: 'Load a model in LM Studio first (click the model picker at the top of the app, then select a model to load).',
          statusCode: 404,
        });
      }
      return models.map((m) => m.id);
    } catch (error) {
      if (error instanceof LMStudioError) throw error;
      throw this._enhanceError(error, 'list models');
    }
  }

  _isEmbedding(id) {
    return /embedding|text-embed|rerank/i.test(String(id));
  }

  async chatStream(messages, model, onToken, onDone, onError, { signal } = {}) {
    const url = this._buildUrl('/chat/completions');
    const body = JSON.stringify({
      model: model || this.defaultModel,
      messages,
      stream: true,
    });

    return new Promise((resolve, reject) => {
      let buffer = '';
      let hasReceivedData = false;
      let completed = false;

      const complete = (err) => {
        if (completed) return;
        completed = true;
        if (signal) signal.removeEventListener('abort', onAbort);
        if (err) {
          onError(err);
          reject(err);
        } else {
          onDone();
          resolve();
        }
      };

      const onAbort = () => {
        req.destroy();
        complete(new Error('Stream aborted by user'));
      };

      const req = this._httpModule.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
          },
          timeout: this.timeout,
        },
        (res) => {
          if (res.statusCode >= 400) {
            req.destroy();
            let detail = `LM Studio error: ${res.statusCode}`;
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                if (parsed.error?.message) detail = `LM Studio error: ${parsed.error.message}`;
              } catch {}
              complete(new LMStudioError(detail, {
                userMessage: 'LM Studio returned an error',
                action: res.statusCode === 404
                  ? `The model "${model}" is not loaded in LM Studio. Load it first, then try again.`
                  : 'Check that LM Studio is running and a model is loaded, then try again.',
                statusCode: res.statusCode,
                details: data.slice(0, 200),
              }));
            });
            return;
          }

          res.on('data', (chunk) => {
            hasReceivedData = true;
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const payload = trimmed.slice(6);

              if (payload === '[DONE]') {
                complete();
                return;
              }

              try {
                const parsed = JSON.parse(payload);

                if (parsed.error) {
                  const err = new LMStudioError(parsed.error.message || 'Model error', {
                    userMessage: 'LM Studio model error',
                    action: 'The model may be out of memory. Load a smaller model or restart LM Studio.',
                    details: parsed.error.message || '',
                  });
                  complete(err);
                  return;
                }

                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) onToken(content);
                if (parsed.choices?.[0]?.finish_reason) {
                  complete();
                  return;
                }
              } catch {
                // skip malformed lines
              }
            }
          });

          res.on('end', () => {
            if (!hasReceivedData) {
              complete(new LMStudioError('No response', {
                userMessage: 'No response from LM Studio',
                action: 'A model may not be loaded. Open LM Studio, load a model, then try again.',
              }));
              return;
            }
            complete();
          });

          res.on('error', (e) => {
            complete(this._enhanceError(e, 'stream'));
          });
        }
      );

      if (signal) {
        if (signal.aborted) { onAbort(); return; }
        signal.addEventListener('abort', onAbort, { once: true });
      }

      req.on('error', (e) => {
        complete(this._enhanceError(e, 'connect'));
      });

      req.on('timeout', () => {
        req.destroy();
        complete(new LMStudioError('Request timeout', {
          userMessage: 'LM Studio took too long to respond',
          action: 'The model may still be loading. Wait a moment and try again.',
        }));
      });

      req.write(body);
      req.end();
    });
  }

  _buildUrl(path) {
    return new URL(String(path).replace(/^\/+/, ''), this.baseUrl + '/');
  }

  _request(path, options = {}) {
    const url = this._buildUrl(path);
    return new Promise((resolve, reject) => {
      const req = this._httpModule.request(
        url,
        {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
            ...options.headers,
          },
          timeout: this.timeout,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
              let detail = `HTTP ${res.statusCode}`;
              try {
                const parsed = JSON.parse(data);
                if (parsed.error?.message) detail = parsed.error.message;
              } catch {}
              return reject(new LMStudioError(detail, {
                userMessage: 'LM Studio returned an error',
                action: 'Check that LM Studio is running and a model is loaded, then try again.',
                statusCode: res.statusCode,
                details: data.slice(0, 200),
              }));
            }

            try {
              resolve(JSON.parse(data));
            } catch {
              reject(new LMStudioError('Invalid JSON response', {
                userMessage: 'Invalid response from LM Studio',
                action: 'LM Studio returned malformed data. Try restarting it.',
              }));
            }
          });
        }
      );

      req.on('error', (e) => {
        reject(this._enhanceError(e, 'request'));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new LMStudioError('Request timeout', {
          userMessage: 'LM Studio took too long to respond',
          action: 'Check that LM Studio is running and a model is loaded, then try again.',
        }));
      });

      if (options.body) req.write(JSON.stringify(options.body));
      req.end();
    });
  }

  _enhanceError(error, operation) {
    const message = error.message || String(error);
    const lowerMessage = message.toLowerCase();
    const code = error.code || (error.errors && error.errors[0] && error.errors[0].code);

    if (code === 'ECONNREFUSED' || lowerMessage.includes('econnrefused') || lowerMessage.includes('connect')) {
      return new LMStudioError('Connection refused', {
        userMessage: 'Cannot connect to LM Studio',
        action: `Make sure LM Studio is running (the local server defaults to ${this.baseUrl}). Start LM Studio, then try again.`,
        statusCode: 503,
      });
    }

    if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
      return new LMStudioError('Timeout', {
        userMessage: 'LM Studio took too long to respond',
        action: 'A model may still be loading. Wait a moment and try again.',
        statusCode: 504,
      });
    }

    if (lowerMessage.includes('network') || lowerMessage.includes('enotfound')) {
      return new NetworkError('Network error', {
        userMessage: 'Network error connecting to LM Studio',
        action: `Check that LM Studio is running at ${this.baseUrl}`,
        statusCode: 503,
      });
    }

    return new LMStudioError(`Failed to ${operation}`, {
      userMessage: `LM Studio error: ${message}`,
      action: 'Check that LM Studio is running properly and try again.',
      details: message,
    });
  }
}

module.exports = { LMStudioProvider, LMStudioError };
