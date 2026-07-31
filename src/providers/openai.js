const { request } = require('node:https');
const { Provider } = require('./base');
const { ProviderError, NetworkError } = require('../errors');

class OpenAIError extends ProviderError {
  constructor(message, options = {}) {
    super('OpenAI', message, options);
  }
}

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
    if (!this.apiKey) {
      throw new OpenAIError('No API key configured', {
        userMessage: 'OpenAI API key not configured',
        action: 'Add your API key to config/default.json. Get a key from platform.openai.com/api-keys',
        statusCode: 401,
      });
    }
    
    try {
      const data = await this._request('/models', { method: 'GET' });
      return (data.data || [])
        .filter((m) => m.id.startsWith('gpt') || m.id.startsWith('o'))
        .map((m) => ({ name: m.id, size: 0 }));
    } catch (error) {
      if (error instanceof OpenAIError) throw error;
      throw this._enhanceError(error, 'list models');
    }
  }

  async listChatModels() {
    if (!this.apiKey) {
      throw new OpenAIError('No API key configured', {
        userMessage: 'OpenAI API key not configured',
        action: 'Add your API key to config/default.json. Get a key from platform.openai.com/api-keys',
        statusCode: 401,
      });
    }
    
    try {
      const data = await this._request('/models', { method: 'GET' });
      return (data.data || [])
        .filter((m) => m.id.startsWith('gpt') || m.id.startsWith('o'))
        .map((m) => m.id);
    } catch (error) {
      if (error instanceof OpenAIError) throw error;
      throw this._enhanceError(error, 'list models');
    }
  }

  async chatStream(messages, model, onToken, onDone, onError, { signal } = {}) {
    if (!this.apiKey) {
      const err = new OpenAIError('No API key configured', {
        userMessage: 'OpenAI API key not configured',
        action: 'Add your API key to config/default.json. Get a key from platform.openai.com/api-keys',
        statusCode: 401,
      });
      onError(err);
      throw err;
    }
    
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
          // Check for error status codes
          if (res.statusCode === 401) {
            req.destroy();
            const err = new OpenAIError('Invalid API key', {
              userMessage: 'OpenAI API key is invalid',
              action: 'Check your API key in config/default.json. Get a valid key from platform.openai.com/api-keys',
              statusCode: 401,
            });
            onError(err);
            reject(err);
            return;
          }
          
          if (res.statusCode === 429) {
            req.destroy();
            const err = new OpenAIError('Rate limit exceeded', {
              userMessage: 'OpenAI rate limit exceeded',
              action: 'You\'ve made too many requests. Wait a minute and try again, or upgrade your OpenAI plan.',
              statusCode: 429,
            });
            onError(err);
            reject(err);
            return;
          }
          
          if (res.statusCode === 402 || res.statusCode === 403) {
            req.destroy();
            const err = new OpenAIError('Quota exceeded', {
              userMessage: 'OpenAI quota exceeded',
              action: 'Your OpenAI account has reached its usage limit. Add credits at platform.openai.com/account/billing',
              statusCode: res.statusCode,
              recoverable: false,
            });
            onError(err);
            reject(err);
            return;
          }
          
          if (res.statusCode === 404) {
            req.destroy();
            const err = new OpenAIError(`Model not found`, {
              userMessage: `Model "${model}" not available`,
              action: 'This model is not available in your OpenAI account. Choose a different model from the picker.',
              statusCode: 404,
            });
            onError(err);
            reject(err);
            return;
          }
          
          if (res.statusCode >= 500) {
            req.destroy();
            const err = new OpenAIError('Server error', {
              userMessage: 'OpenAI server error',
              action: 'OpenAI is experiencing issues. Wait a moment and try again.',
              statusCode: res.statusCode,
            });
            onError(err);
            reject(err);
            return;
          }
          
          if (res.statusCode >= 400) {
            req.destroy();
            const err = new OpenAIError(`HTTP ${res.statusCode}`, {
              userMessage: 'OpenAI returned an error',
              action: 'Check your request and try again. If the problem persists, check OpenAI status.',
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
                
                // Check for error in stream
                if (parsed.error) {
                  const err = this._parseApiError(parsed.error);
                  onError(err);
                  reject(err);
                  return;
                }
                
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
            if (!hasReceivedData) {
              const err = new OpenAIError('No response', {
                userMessage: 'No response from OpenAI',
                action: 'Check your internet connection and try again.',
              });
              onError(err);
              reject(err);
              return;
            }
            resolve();
          });
          
          res.on('error', (e) => {
            const enhanced = this._enhanceError(e, 'stream');
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
      
      req.on('timeout', () => {
        req.destroy();
        const err = new OpenAIError('Request timeout', {
          userMessage: 'OpenAI took too long to respond',
          action: 'Check your internet connection and try again.',
        });
        onError(err);
        reject(err);
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
            if (res.statusCode === 401) {
              return reject(new OpenAIError('Invalid API key', {
                userMessage: 'OpenAI API key is invalid',
                action: 'Check your API key in config/default.json. Get a valid key from platform.openai.com/api-keys',
                statusCode: 401,
              }));
            }
            
            if (res.statusCode === 429) {
              return reject(new OpenAIError('Rate limit exceeded', {
                userMessage: 'OpenAI rate limit exceeded',
                action: 'You\'ve made too many requests. Wait a minute and try again, or upgrade your OpenAI plan.',
                statusCode: 429,
              }));
            }
            
            if (res.statusCode === 402 || res.statusCode === 403) {
              return reject(new OpenAIError('Quota exceeded', {
                userMessage: 'OpenAI quota exceeded',
                action: 'Your OpenAI account has reached its usage limit. Add credits at platform.openai.com/account/billing',
                statusCode: res.statusCode,
                recoverable: false,
              }));
            }
            
            if (res.statusCode < 200 || res.statusCode >= 300) {
              let errorDetail = `HTTP ${res.statusCode}`;
              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  return reject(this._parseApiError(parsed.error));
                }
              } catch {}
              
              return reject(new OpenAIError(errorDetail, {
                userMessage: 'OpenAI returned an error',
                action: res.statusCode >= 500 
                  ? 'OpenAI is experiencing issues. Wait a moment and try again.'
                  : 'Check your request and try again.',
                statusCode: res.statusCode,
                details: data.slice(0, 200),
              }));
            }
            
            try {
              resolve(JSON.parse(data));
            } catch {
              reject(new OpenAIError('Invalid JSON response', {
                userMessage: 'Invalid response from OpenAI',
                action: 'OpenAI returned malformed data. Try again.',
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
        reject(new OpenAIError('Request timeout', {
          userMessage: 'OpenAI took too long to respond',
          action: 'Check your internet connection and try again.',
        }));
      });
      
      if (options.body) req.write(JSON.stringify(options.body));
      req.end();
    });
  }
  
  _parseApiError(errorObj) {
    const message = errorObj.message || String(errorObj);
    const type = errorObj.type || '';
    const code = errorObj.code || '';
    
    if (type === 'insufficient_quota' || message.includes('quota')) {
      return new OpenAIError('Quota exceeded', {
        userMessage: 'OpenAI quota exceeded',
        action: 'Your OpenAI account has reached its usage limit. Add credits at platform.openai.com/account/billing',
        statusCode: 402,
        recoverable: false,
      });
    }
    
    if (type === 'invalid_api_key' || message.includes('invalid') && message.includes('key')) {
      return new OpenAIError('Invalid API key', {
        userMessage: 'OpenAI API key is invalid',
        action: 'Check your API key in config/default.json. Get a valid key from platform.openai.com/api-keys',
        statusCode: 401,
      });
    }
    
    if (message.includes('rate limit')) {
      return new OpenAIError('Rate limit exceeded', {
        userMessage: 'OpenAI rate limit exceeded',
        action: 'You\'ve made too many requests. Wait a minute and try again, or upgrade your OpenAI plan.',
        statusCode: 429,
      });
    }
    
    if (message.includes('model') && message.includes('not found')) {
      return new OpenAIError('Model not found', {
        userMessage: 'Model not available',
        action: 'This model is not available in your OpenAI account. Choose a different model.',
        statusCode: 404,
      });
    }
    
    return new OpenAIError(message, {
      userMessage: `OpenAI error: ${message}`,
      action: 'Check the error details and try again.',
      details: message,
    });
  }
  
  _enhanceError(error, operation) {
    const message = error.message || String(error);
    const lowerMessage = message.toLowerCase();
    
    // Connection errors
    if (lowerMessage.includes('econnrefused') || lowerMessage.includes('connect')) {
      return new NetworkError('Connection refused', {
        userMessage: 'Cannot connect to OpenAI',
        action: 'Check your internet connection and firewall settings. OpenAI may also be temporarily unavailable.',
        statusCode: 503,
      });
    }
    
    // Timeout errors
    if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
      return new OpenAIError('Timeout', {
        userMessage: 'OpenAI took too long to respond',
        action: 'Check your internet connection and try again.',
        statusCode: 504,
      });
    }
    
    // DNS/Network errors
    if (lowerMessage.includes('enotfound') || lowerMessage.includes('network')) {
      return new NetworkError('Network error', {
        userMessage: 'Cannot reach OpenAI',
        action: 'Check your internet connection and DNS settings.',
        statusCode: 503,
      });
    }
    
    // SSL/TLS errors
    if (lowerMessage.includes('certificate') || lowerMessage.includes('ssl')) {
      return new NetworkError('SSL error', {
        userMessage: 'Secure connection failed',
        action: 'Check your system time and date settings, or try again later.',
        statusCode: 503,
      });
    }
    
    // Generic wrapper
    return new OpenAIError(`Failed to ${operation}`, {
      userMessage: `OpenAI error: ${message}`,
      action: 'Check your connection and OpenAI status, then try again.',
      details: message,
    });
  }
}

module.exports = { OpenAIProvider, OpenAIError };
