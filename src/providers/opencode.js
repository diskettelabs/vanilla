const { spawn } = require('node:child_process');
const { Provider } = require('./base');

class OpenCodeProvider extends Provider {
  static label = 'OpenCode CLI';

  constructor(config) {
    super(config);
    this.command = config.command || 'opencode';
    this.args = config.args || ['--no-color', '--no-stream'];
  }

  async listModels() {
    return [{ name: this.config.defaultModel || 'default', size: 0 }];
  }

  async listChatModels() {
    return [this.config.defaultModel || 'default'];
  }

  async chatStream(messages, model, onToken, onDone, onError, { signal } = {}) {
    const prompt = this._buildPrompt(messages);

    return new Promise((resolve, reject) => {
      const child = spawn(this.command, [...this.args, prompt], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env },
      });

      const onAbort = () => {
        child.kill('SIGTERM');
        const e = new Error('Stream aborted by user');
        onError(e);
        reject(e);
      };
      if (signal) {
        if (signal.aborted) { onAbort(); return; }
        signal.addEventListener('abort', onAbort, { once: true });
      }

      let fullContent = '';

      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        fullContent += text;
        onToken(text);
      });

      child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        if (text.trim()) onToken(text);
      });

      child.on('close', (code) => {
        onDone();
        resolve();
      });

      child.on('error', (e) => {
        onError(e);
        reject(e);
      });
    });
  }

  _buildPrompt(messages) {
    const last = messages.filter((m) => m.role !== 'system').slice(-1);
    const prev = messages.filter((m) => m.role !== 'system').slice(-3, -1);
    const context = prev.map((m) => `${m.role}: ${m.content}`).join('\n');
    const prompt = last.map((m) => m.content).join('\n');
    return context ? `${context}\n\n${prompt}` : prompt;
  }
}

module.exports = { OpenCodeProvider };
