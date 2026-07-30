const { OllamaProvider } = require('./ollama');
const { OpenAIProvider } = require('./openai');
const { AnthropicProvider } = require('./anthropic');
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

function getProviderNamesWithLabels() {
  return Object.entries(providers).map(([key, Cls]) => ({
    id: key,
    label: Cls.label || key,
  }));
}

register('ollama', OllamaProvider);
register('openai', OpenAIProvider);
register('anthropic', AnthropicProvider);
register('opencode', OpenCodeProvider);
register('aider', AiderProvider);
register('goose', GooseProvider);

module.exports = { register, create, listProviders, getProviderNamesWithLabels };
