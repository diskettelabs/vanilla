// Debug provider loading
const providers = require('./src/providers');
const CONFIG = require('./config/default.json');

console.log('=== Provider Debug ===\n');

// Test what getProviderNamesWithLabels returns
const providerList = providers.getProviderNamesWithLabels(CONFIG.providers);

console.log('All registered providers:');
providerList.forEach(p => {
  console.log(`  - ${p.id} (${p.label})`);
  console.log(`    requiresKey: ${p.requiresKey}`);
  console.log(`    hasKey: ${p.hasKey}`);
});

console.log('\n=== Gemini Provider Test ===\n');

// Test Gemini specifically
const geminiConfig = CONFIG.providers.gemini || {};
console.log('Gemini config from default.json:', geminiConfig);

const geminiProvider = providers.create('gemini', geminiConfig);
console.log('Gemini baseUrl:', geminiProvider.baseUrl);
console.log('Gemini hasConfiguredKey():', geminiProvider.hasConfiguredKey());
console.log('Gemini defaultModel:', geminiProvider.defaultModel);

// Test with a fake API key
console.log('\n=== With API Key ===\n');
const geminiWithKey = providers.create('gemini', { ...geminiConfig, apiKey: 'fake-key-for-testing' });
console.log('Gemini hasConfiguredKey() with key:', geminiWithKey.hasConfiguredKey());
