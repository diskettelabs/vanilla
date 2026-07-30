const { spawn } = require('node:child_process');
const { Provider } = require('./base');

class CLIProvider extends Provider {
  static label = 'CLI Tool';

  constructor(config) {
    super(config);
    this.command = config.command;
    this.args = config.args || [];
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
        const text = chunk.toString();
        onToken(text);
      });

      child.stderr.on('data', () => {
        // ignore stderr by default
      });

      child.on('close', (code) => {
        if (code !== 0) {
          onError(new Error(`Process exited with code ${code}`));
          reject(new Error(`Process exited with code ${code}`));
          return;
        }
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
    return messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n') + '\n\nAssistant:';
  }
}

module.exports = { CLIProvider };
