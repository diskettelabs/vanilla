const { OpenAIProvider } = require('./openai');

class HuggingFaceProvider extends OpenAIProvider {
  static label = 'HuggingFace';
  static requiresKey = true;

  constructor(config) {
    super({
      ...config,
      baseUrl: (config?.baseUrl || 'https://router.huggingface.co/v1').replace(/\/+$/, ''),
      defaultModel: config?.defaultModel || 'meta-llama/Llama-3.1-8B-Instruct',
      requestTimeout: config?.requestTimeout || 120000,
    });
    this.apiKey = config?.apiKey || process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN || '';
  }

  hasConfiguredKey() {
    return Boolean(this.apiKey);
  }

  async listModels() {
    if (!this.apiKey) return [];
    const data = await this._request('/models', { method: 'GET' });
    return Array.from(data.data || [])
      .map((m) => ({ name: m.id, size: 0 }));
  }

  async listChatModels() {
    if (!this.apiKey) return [this.defaultModel];
    const data = await this._request('/models', { method: 'GET' });
    return Array.from(data.data || []).map((m) => m.id);
  }
}

module.exports = { HuggingFaceProvider };
