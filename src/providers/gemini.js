const { OpenAIProvider } = require('./openai');

class GeminiProvider extends OpenAIProvider {
  static label = 'Google Gemini';
  static requiresKey = true;

  constructor(config) {
    super({
      ...config,
      baseUrl: (config?.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/+$/, ''),
      defaultModel: config?.defaultModel || 'gemini-2.5-flash',
      requestTimeout: config?.requestTimeout || 120000,
    });
    this.apiKey = config?.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  }

  hasConfiguredKey() {
    return Boolean(this.apiKey);
  }

  async listModels() {
    if (!this.apiKey) return [];
    const data = await this._request('/models', { method: 'GET' });
    return (data.data || [])
      .filter((m) => m.id.startsWith('gemini') && !m.id.toLowerCase().includes('embedding'))
      .map((m) => ({ name: m.id, size: 0 }));
  }

  async listChatModels() {
    if (!this.apiKey) return [this.defaultModel];
    const data = await this._request('/models', { method: 'GET' });
    return (data.data || [])
      .filter((m) => m.id.startsWith('gemini') && !m.id.toLowerCase().includes('embedding'))
      .map((m) => m.id);
  }
}

module.exports = { GeminiProvider };
