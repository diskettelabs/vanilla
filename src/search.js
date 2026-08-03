const { request } = require('node:https');

const DEFAULT_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function fetchText(url, headers = {}, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method: 'GET',
        headers: { 'User-Agent': DEFAULT_UA, ...headers },
        timeout,
      },
      (res) => {
        if (res.statusCode >= 400) {
          res.resume();
          return reject(new Error(`Search request failed with status ${res.statusCode}`));
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      }
    );
    req.on('timeout', () => req.destroy(new Error('Search request timed out')));
    req.on('error', reject);
    req.end();
  });
}

function strip(htmlText) {
  return htmlText
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeDdgUrl(href) {
  try {
    const url = new URL(href, 'https://duckduckgo.com');
    const target = url.searchParams.get('uddg');
    return target ? decodeURIComponent(target) : url.href;
  } catch {
    return href;
  }
}

async function duckduckgo(query) {
  const q = encodeURIComponent(query);
  let html = '';
  try {
    html = await fetchText(`https://html.duckduckgo.com/html/?q=${q}`);
  } catch {
    html = await fetchText(`https://lite.duckduckgo.com/lite/?q=${q}`);
  }

  const results = [];
  const blocks = html.split('<div class="result');
  for (const block of blocks.slice(1)) {
    const link = block.match(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/s);
    if (!link) continue;
    const snippet = block.match(/<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/s) || block.match(/<td[^>]*class="result-snippet"[^>]*>(.*?)<\/td>/s);
    results.push({
      title: strip(link[2]),
      url: decodeDdgUrl(link[1]),
      snippet: snippet ? strip(snippet[1]) : '',
    });
  }

  if (results.length === 0) {
    const rows = html.split('<a rel="nofollow"');
    for (const row of rows.slice(1)) {
      const link = row.match(/href="([^"]+)"/);
      const title = row.match(/>\s*(.*?)\s*<\/a>/s);
      if (!link || !title) continue;
      const snippet = row.match(/<td[^>]*class="result-snippet"[^>]*>(.*?)<\/td>/s);
      results.push({
        title: strip(title[1]),
        url: decodeDdgUrl(link[1]),
        snippet: snippet ? strip(snippet[1]) : '',
      });
    }
  }

  return results.slice(0, 5);
}

async function brave(query, apiKey) {
  const q = encodeURIComponent(query);
  const data = await fetchText(`https://api.search.brave.com/res/v1/web/search?q=${q}&count=5`, {
    'X-Subscription-Token': apiKey,
  });
  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch {
    throw new Error('Brave Search returned an invalid response');
  }
  return (parsed.web?.results || []).slice(0, 5).map((r) => ({
    title: r.title || '',
    url: r.url || '',
    snippet: r.description || '',
  }));
}

async function searchWeb(query, options = {}) {
  const backend = options.backend || 'duckduckgo';
  if (backend === 'brave') {
    if (!options.apiKey) throw new Error('A Brave Search API key is required');
    return brave(query, options.apiKey);
  }
  return duckduckgo(query);
}

module.exports = { searchWeb };
