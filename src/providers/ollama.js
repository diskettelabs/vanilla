const { request } = require('node:http');
const { Provider } = require('./base');
const { ProviderError, NetworkError, parseError } = require('../errors');

class OllamaError extends ProviderError {
  constructor(message, options = {}) {
    super('Ollama', message, options);
  }
}

class OllamaProvider extends Provider {
  static label = 'Ollama (Local)';

  constructor(config) {
    super(config);
    this.host = config.host || 'http://localhost:11434';
    this.timeout = config.requestTimeout || 30000;
  }

  async listModels() {
    try {
      const data = await this._request('/api/tags');
      if (!data.models || data.models.length === 0) {
        throw new OllamaError('No models found', {
          userMessage: 'No Ollama models found',
          action: 'Install a model first. Run "ollama pull llama2" or "ollama pull mistral" in your terminal.',
          statusCode: 404,
        });
      }
      return (data.models || []).map((m) => ({ name: m.name, size: m.size }));
    } catch (error) {
      if (error instanceof OllamaError) throw error;
      throw this._enhanceError(error, 'list models');
    }
  }

  async listChatModels() {
    try {
      const data = await this._request('/api/tags');
      if (!data.models || data.models.length === 0) {
        throw new OllamaError('No models found', {
          userMessage: 'No Ollama models found',
          action: 'Install a model first. Run "ollama pull llama2" or "ollama pull mistral" in your terminal.',
          statusCode: 404,
        });
      }
      return (data.models || []).map((m) => m.name);
    } catch (error) {
      if (error instanceof OllamaError) throw error;
      throw this._enhanceError(error, 'list models');
    }
  }

  async chatStream(messages, model, onToken, onDone, onError, { signal } = {}) {
    const url = new URL('/api/chat', this.host);
    const body = JSON.stringify({ 
      model, 
      messages, 
      stream: true,
      options: {
        temperature: 0.7,
        top_p: 0.9
      }
    });

    return new Promise((resolve, reject) => {
      const req = request(
        url,
        { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          timeout: 0  // No timeout - streaming can take a long time
        },
        (res) => {
          // Check for error status codes before streaming
          if (res.statusCode === 404) {
            req.destroy();
            const err = new OllamaError(`Model "${model}" not found`, {
              userMessage: `Model "${model}" not found`,
              action: `Install this model by running "ollama pull ${model}" in your terminal, or choose a different model.`,
              statusCode: 404,
            });
            onError(err);
            reject(err);
            return;
          }
          
          if (res.statusCode >= 400) {
            req.destroy();
            const err = new OllamaError(`Ollama error: ${res.statusCode}`, {
              userMessage: 'Ollama returned an error',
              action: 'Check that Ollama is running properly. Try restarting Ollama or selecting a different model.',
              statusCode: res.statusCode,
            });
            onError(err);
            reject(err);
            return;
          }
          
          let buffer = '';
          let hasReceivedData = false;
          
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
            hasReceivedData = true;
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const parsed = JSON.parse(line);
                
                // Check for error in response
                if (parsed.error) {
                  const err = new OllamaError(parsed.error, {
                    userMessage: 'Model error',
                    action: parsed.error.includes('out of memory') 
                      ? 'The model ran out of memory. Try a smaller model or restart Ollama.'
                      : 'Try restarting Ollama or selecting a different model.',
                  });
                  onError(err);
                  reject(err);
                  return;
                }
                
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
            if (!hasReceivedData) {
              const err = new OllamaError('No response from model', {
                userMessage: 'No response from Ollama',
                action: 'The model may be loading. Wait a moment and try again. For large models, the first response can take 30-60 seconds.',
              });
              onError(err);
              reject(err);
              return;
            }
            
            if (buffer.trim()) {
              try {
                const parsed = JSON.parse(buffer);
                if (parsed.done) onDone(parsed);
              } catch { /* ignore */ }
            }
            resolve();
          });
          
          res.on('error', (e) => {
            const enhanced = this._enhanceError(e, 'stream response');
            onError(enhanced);
            reject(enhanced);
          });
        }
      );
      
      req.on('error', (e) => {
        const enhanced = this._enhanceError(e, 'connect');
        onError(enhanced);
        reject(enhanced);
      });
      
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
            if (res.statusCode === 404) {
              return reject(new OllamaError('Endpoint not found', {
                userMessage: 'Cannot connect to Ollama',
                action: 'Make sure Ollama is running. Run "ollama serve" in your terminal, or start the Ollama app.',
                statusCode: 404,
              }));
            }
            
            if (res.statusCode < 200 || res.statusCode >= 300) {
              return reject(new OllamaError(`HTTP ${res.statusCode}`, {
                userMessage: 'Ollama returned an error',
                action: 'Check that Ollama is running properly and try again.',
                statusCode: res.statusCode,
              }));
            }
            
            try {
              resolve(JSON.parse(data));
            } catch {
              reject(new OllamaError('Invalid JSON response', {
                userMessage: 'Invalid response from Ollama',
                action: 'Ollama may be malfunctioning. Try restarting Ollama.',
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
        reject(new OllamaError('Request timed out', {
          userMessage: 'Ollama took too long to respond',
          action: 'The model might be loading. Wait a moment and try again. For large models, the first response can take 30-60 seconds.',
        }));
      });
      
      if (options.body) req.write(JSON.stringify(options.body));
      req.end();
    });
  }
  
  _enhanceError(error, operation) {
    const message = error.message || String(error);
    const lowerMessage = message.toLowerCase();
    
    // Connection errors
    if (lowerMessage.includes('econnrefused') || lowerMessage.includes('connect')) {
      return new OllamaError('Connection refused', {
        userMessage: 'Cannot connect to Ollama',
        action: 'Make sure Ollama is running on your machine. Run "ollama serve" in your terminal, or start the Ollama app if installed.',
        statusCode: 503,
      });
    }
    
    // Timeout errors
    if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
      return new OllamaError('Timeout', {
        userMessage: 'Ollama took too long to respond',
        action: 'The model might be loading. Wait a moment and try again. For large models, the first response can take 30-60 seconds.',
        statusCode: 504,
      });
    }
    
    // Network errors
    if (lowerMessage.includes('network') || lowerMessage.includes('enotfound')) {
      return new NetworkError('Network error', {
        userMessage: 'Network error connecting to Ollama',
        action: `Check that Ollama is running at ${this.host}`,
        statusCode: 503,
      });
    }
    
    // Generic wrapper
    return new OllamaError(`Failed to ${operation}`, {
      userMessage: `Ollama error: ${message}`,
      action: 'Check that Ollama is running properly and try again.',
      details: message,
    });
  }
}

module.exports = { OllamaProvider, OllamaError };
