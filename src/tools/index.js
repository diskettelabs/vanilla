const https = require('node:https');
const http = require('node:http');

const TOOLS = [
  {
    name: 'web_search',
    description: 'Search the web for current information. Returns relevant snippets and URLs.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'web_fetch',
    description: 'Fetch and extract the text content from a URL.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to fetch' },
      },
      required: ['url'],
    },
  },
  {
    name: 'image_recognition',
    description: 'Analyze an image using a vision-capable AI model. Provide the image URL to analyze.',
    input_schema: {
      type: 'object',
      properties: {
        image_url: { type: 'string', description: 'URL of the image to analyze' },
        prompt: { type: 'string', description: 'What to ask about the image (optional)' },
      },
      required: ['image_url'],
    },
  },
];

function getToolDefs() {
  return TOOLS.map(({ name, description, input_schema }) => ({
    name,
    description,
    input_schema,
  }));
}

function buildToolsSystemMessage(toolDefs) {
  const desc = toolDefs.map((t) => {
    const schema = JSON.stringify(t.input_schema, null, 2);
    return `## ${t.name}\n${t.description}\n\nInput schema:\n\`\`\`json\n${schema}\n\`\`\``;
  }).join('\n\n');

  return `You have access to the following tools you can use to answer the user's questions. When you need to use a tool, respond with a tool call in this exact format:

<TOOL_CALL>
{"name": "<tool_name>", "arguments": {<arguments>}}
</TOOL_CALL>

After the tool returns a result, I will show you the result and you can continue the conversation. You may call multiple tools sequentially if needed.

Available tools:

${desc}

Important: Only call a tool if you actually need information from it. For general conversational questions, just respond normally without tool calls.`;
}

function execToolCall(name, args) {
  switch (name) {
    case 'web_search': return execWebSearch(args.query);
    case 'web_fetch': return execWebFetch(args.url);
    case 'image_recognition': return execImageRecognition(args.image_url, args.prompt);
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

function fetchUrl(url, options = {}) {
  const proto = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const req = proto.get(url, { timeout: 15000, ...options }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk.toString(); });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
  });
}

async function execWebSearch(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const html = await fetchUrl(url);
  const results = [];
  const linkRe = /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRe = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  const urls = [];
  let m;
  while ((m = linkRe.exec(html)) !== null && results.length < 5) {
    const href = m[1].replace(/\/\/duckduckgo\.com\/l\/\?uddg=/, '').replace(/&rut=.*$/, '');
    const title = m[2].replace(/<[^>]+>/g, '').trim();
    if (title && href) {
      results.push({ title, href: decodeURIComponent(href) });
    }
  }
  let si = 0;
  while ((m = snippetRe.exec(html)) !== null && si < results.length) {
    results[si].snippet = m[1].replace(/<[^>]+>/g, '').trim();
    si++;
  }
  return results.length
    ? JSON.stringify(results.slice(0, 5), null, 2)
    : 'No results found.';
}

async function execWebFetch(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  const html = await fetchUrl(url);
  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000);
  return cleaned || 'No content could be extracted from that URL.';
}

async function execImageRecognition(imageUrl, prompt) {
  prompt = prompt || 'Describe this image in detail.';
  return JSON.stringify({
    note: 'Image recognition requires a vision-capable model. To analyze this image, please use the chat provider directly with the image URL included in your message. The image URL is: ' + imageUrl,
    prompt,
    image_url: imageUrl,
  });
}

module.exports = { getToolDefs, buildToolsSystemMessage, execToolCall };
