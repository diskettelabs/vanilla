// Test Gemini API directly
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error('No GEMINI_API_KEY or GOOGLE_API_KEY environment variable set');
  console.log('Usage: GEMINI_API_KEY=your-key-here node test-gemini.js');
  process.exit(1);
}

const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/';
const url = new URL('models', baseUrl);

console.log('Testing Gemini API...');
console.log('URL:', url.href);
console.log('API Key:', apiKey.substring(0, 10) + '...');

const req = https.request(url, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
    if (res.statusCode === 200) {
      try {
        const parsed = JSON.parse(data);
        console.log('\nAvailable models:', parsed.data?.map(m => m.id) || []);
      } catch (e) {
        console.error('Failed to parse JSON');
      }
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.end();
