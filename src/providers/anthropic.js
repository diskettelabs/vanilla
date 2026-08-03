const { request } = require('node:https');
const { Provider } = require('./base');

class AnthropicProvider extends Provider {
  static label = 'Anthropic Claude';
  static requiresKey = true;

  constructor(config) {
    super(config);
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.baseUrl = (config.baseUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
    this.timeout = config.requestTimeout || 60000;
    this.defaultModel = config.defaultModel || 'claude-3-5-haiku-latest';
  }

  hasConfiguredKey() {
    return Boolean(this.apiKey);
  }

  async listModels() {
    return [{ name: this.defaultModel, size: 0 }];
  }

  async listChatModels() {
    return [this.defaultModel];
  }

  async chatStream(messages, model, onToken, onDone, onError, { signal } = {}) {
    const url = new URL('/messages', this.baseUrl);

    const systemMessages = messages.filter((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const body = JSON.stringify({
      model: model || this.defaultModel,
      messages: chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      ...(systemMessages.length ? { system: systemMessages.map((m) => m.content).join('\n') } : {}),
      stream: true,
      max_tokens: 4096,
    });

    return new Promise((resolve, reject) => {
      const req = request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
          },
          timeout: 0,  // No timeout - streaming can take a long time
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
              try {
                const parsed = JSON.parse(payload);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  onToken(parsed.delta.text);
                }
                if (parsed.type === 'message_stop') {
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
}

module.exports = { AnthropicProvider };
