const { OpenAIProvider } = require('./openai');

class MiniMaxProvider extends OpenAIProvider {
  static label = 'MiniMax';
  static requiresKey = true;

  constructor(config) {
    super({
      ...config,
      baseUrl: (config.baseUrl || 'https://api.minimax.io/v1').replace(/\/+$/, '') + '/',
      apiKey: config.apiKey || process.env.MINIMAX_API_KEY || '',
      requestTimeout: config.requestTimeout || 120000,
      defaultModel: config.defaultModel || 'MiniMax-M3',
    });
  }

  // MiniMax models are OpenAI-compatible chat completions; expose the
  // configured model(s) directly rather than relying on a filtered /models.
  async listModels() {
    if (!this.apiKey) {
      throw new Error('No MiniMax API key configured');
    }
    const models = Array.isArray(this.defaultModel)
      ? this.defaultModel
      : [this.defaultModel];
    return models.map((name) => ({ name, size: 0 }));
  }

  async listChatModels() {
    if (!this.apiKey) {
      throw new Error('No MiniMax API key configured');
    }
    return Array.isArray(this.defaultModel) ? this.defaultModel : [this.defaultModel];
  }
}

module.exports = { MiniMaxProvider };
