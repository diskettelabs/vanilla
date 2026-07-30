const { spawn } = require('node:child_process');
const { Provider } = require('./base');

class AiderProvider extends Provider {
  static label = 'Aider CLI';

  constructor(config) {
    super(config);
    this.command = config.command || 'aider';
    this.args = config.args || ['--no-auto-commits', '--no-suggest-shell-commands', '--chat-mode', 'architect'];
    this.defaultModel = config.defaultModel || 'claude-3-5-sonnet-20241022';
  }

  async listModels() {
    return [{ name: this.defaultModel, size: 0 }];
  }

  async listChatModels() {
    return [this.defaultModel];
  }

  async chatStream(messages, model, onToken, onDone, onError, { signal } = {}) {
    const prompt = this._buildPrompt(messages);

    return new Promise((resolve, reject) => {
      const child = spawn(this.command, [...this.args, '--message', prompt], {
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

      child.stdout.on('data', (chunk) => {
        onToken(chunk.toString());
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
    return last.map((m) => m.content).join('\n');
  }
}

module.exports = { AiderProvider };
