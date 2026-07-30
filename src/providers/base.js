class Provider {
  constructor(config) {
    this.config = config || {};
  }

  async listModels() {
    throw new Error('listModels not implemented');
  }

  async chatStream(messages, model, onToken, onDone, onError, { signal } = {}) {
    throw new Error('chatStream not implemented');
  }
}

module.exports = { Provider };
