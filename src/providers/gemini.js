const { OpenAIProvider } = require('./openai');

class GeminiProvider extends OpenAIProvider {
  static label = 'Google Gemini';
  static requiresKey = true;

  constructor(config) {
    super({
      ...config,
      // Include trailing slash so relative paths append correctly
      baseUrl: (config?.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai/').replace(/\/+$/, '') + '/',
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
    const data = await this._request('models', { method: 'GET' });
    return (data.data || [])
      .filter((m) => m.id.includes('gemini'))
      .map((m) => ({ 
        // Strip 'models/' prefix if present
        name: m.id.replace(/^models\//, ''), 
        size: 0 
      }));
  }

  async listChatModels() {
    if (!this.apiKey) return [this.defaultModel];
    try {
      const data = await this._request('models', { method: 'GET' });
      console.log('[Gemini] API response:', JSON.stringify(data).slice(0, 500));
      const models = (data.data || [])
        .filter((m) => m.id.includes('gemini'))
        .map((m) => m.id.replace(/^models\//, '')); // Strip 'models/' prefix
      console.log('[Gemini] Filtered models:', models);
      if (models.length === 0) {
        console.warn('[Gemini] No models found! Returning default model.');
        return [this.defaultModel];
      }
      return models;
    } catch (error) {
      console.error('[Gemini] listChatModels error:', error.message);
      // Return default model on error so Gemini still shows up
      return [this.defaultModel];
    }
  }
}

module.exports = { GeminiProvider };
