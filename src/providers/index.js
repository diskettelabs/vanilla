const { OllamaProvider } = require('./ollama');
const { OpenAIProvider } = require('./openai');
const { AnthropicProvider } = require('./anthropic');
const { HuggingFaceProvider } = require('./huggingface');
const { GeminiProvider } = require('./gemini');
const { LMStudioProvider } = require('./lmstudio');
const { OpenCodeProvider } = require('./opencode');
const { AiderProvider } = require('./aider');
const { GooseProvider } = require('./goose');

const providers = {};

function register(name, cls) {
  providers[name] = cls;
}

function create(name, config) {
  const Cls = providers[name];
  if (!Cls) throw new Error(`Unknown provider: ${name}`);
  return new Cls(config || {});
}

function listProviders() {
  return Object.keys(providers);
}

function getProviderNamesWithLabels(providerConfigs = {}) {
  return Object.entries(providers).map(([key, Cls]) => {
    const instance = new Cls(providerConfigs[key] || {});
    return {
      id: key,
      label: Cls.label || key,
      requiresKey: Boolean(Cls.requiresKey),
      hasKey: instance.hasConfiguredKey(),
    };
  });
}

register('ollama', OllamaProvider);
register('openai', OpenAIProvider);
register('anthropic', AnthropicProvider);
register('huggingface', HuggingFaceProvider);
register('gemini', GeminiProvider);
register('lmstudio', LMStudioProvider);
register('opencode', OpenCodeProvider);
register('aider', AiderProvider);
register('goose', GooseProvider);

module.exports = { register, create, listProviders, getProviderNamesWithLabels };
