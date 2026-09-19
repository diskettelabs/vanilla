const { execFile } = require('node:child_process');
const http = require('node:http');
const https = require('node:https');
const workspace = require('./workspace');
const { searchWeb } = require('./search');

const MAX_TOOL_ROUNDS = 6;

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the public web for current information. Use this when the answer may have changed or needs sources.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'A concise search query.' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_workspace_files',
      description: 'List every file currently in the user\'s workspace directory, with sizes and modification times.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the full contents of a text file from the workspace directory. Use list_workspace_files first if you don\'t know the path.',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Path relative to the workspace directory, e.g. "notes.md" or "src/app.js".' } },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Save a document to the workspace directory — use this whenever the user asks to "save it", "save this", "save it to a file", or "save it to the workspace". Creates a new file or overwrites one, and creates parent folders automatically.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path relative to the workspace directory, e.g. "notes.md" or "src/app.js".' },
          content: { type: 'string', description: 'The full text content to write to the file.' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_file',
      description: 'Delete a single file from the workspace directory. Only files, never directories.',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Path relative to the workspace directory of the file to delete.' } },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: "Run a shell command in the working directory. Use for git operations, builds, tests, and package managers. Prefer one focused command at a time and avoid interactive prompts.",
      parameters: {
        type: 'object',
        properties: { command: { type: 'string', description: 'The full shell command to run, e.g. "npm test" or "git status".' } },
        required: ['command'],
      },
    },
  },
];

const TOOLS_BY_NAME = Object.fromEntries(TOOL_DEFINITIONS.map((t) => [t.function.name, t]));

function anthropicTools(tools) {
  return tools.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));
}

function runCommand(command, { cwd, timeout = 120000, maxBuffer = 10 * 1024 * 1024 } = {}) {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const file = isWin ? 'cmd.exe' : '/bin/sh';
    const args = isWin ? ['/d', '/s', '/c', command] : ['-c', command];
    execFile(file, args, { cwd, timeout, maxBuffer, env: process.env }, (err, stdout, stderr) => {
      const output = [stdout, stderr].filter(Boolean).join('\n').trim();
      resolve({ exitCode: err ? (typeof err.code === 'number' ? err.code : 1) : 0, output: output || (err ? err.message : '') });
    });
  });
}

async function executeTool(name, argsRaw, options = {}) {
  const root = options.root || workspace.WORKSPACE_DIR;
  let args = {};
  if (typeof argsRaw === 'string') {
    try { args = JSON.parse(argsRaw); } catch { args = {}; }
  } else if (argsRaw && typeof argsRaw === 'object') {
    args = argsRaw;
  }

  try {
    switch (name) {
      case 'web_search': {
        if (!args.query) return { ok: false, output: 'Missing required argument: query' };
        const results = await searchWeb(String(args.query), {
          backend: options.searchBackend || 'duckduckgo',
          apiKey: options.searchApiKey,
        });
        return { ok: true, output: JSON.stringify(results.slice(0, 8), null, 2) };
      }
      case 'list_workspace_files': {
        const files = workspace.listFiles(root);
        return { ok: true, output: JSON.stringify(files, null, 2) };
      }
      case 'read_file': {
        if (!args.path) return { ok: false, output: 'Missing required argument: path' };
        const result = workspace.readFile(args.path, 200000, root);
        return {
          ok: true,
          output: result.truncated
            ? `[File truncated — only the first 200,000 bytes shown]\n\n${result.content}`
            : result.content,
        };
      }
      case 'write_file': {
        if (!args.path) return { ok: false, output: 'Missing required argument: path' };
        const result = workspace.writeFile(args.path, args.content, root);
        return { ok: true, output: `Wrote ${result.path} (${result.size} bytes) to the working directory.` };
      }
      case 'delete_file': {
        if (!args.path) return { ok: false, output: 'Missing required argument: path' };
        const result = workspace.deleteFile(args.path, root);
        return { ok: true, output: `Deleted ${result.path} from the working directory.` };
      }
      case 'run_command': {
        const command = String(args.command || '').trim();
        if (!command) return { ok: false, output: 'Missing required argument: command' };
        const result = await runCommand(command, { cwd: root, timeout: options.commandTimeout });
        return result.exitCode === 0
          ? { ok: true, output: result.output || '(command completed with no output)' }
          : { ok: false, output: `Command exited with code ${result.exitCode}:\n${result.output}` };
      }
      default:
        return { ok: false, output: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { ok: false, output: e.message || String(e) };
  }
}

function _jsonRequest(url, { method = 'POST', headers = {}, body, timeout = 300000, signal } = {}) {
  const lib = url.protocol === 'http:' ? http : https;
  return new Promise((resolve, reject) => {
    const req = lib.request(
      url,
      {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        timeout,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = null;
          try { parsed = data ? JSON.parse(data) : null; } catch { /* keep null */ }
          if (res.statusCode < 200 || res.statusCode >= 300) {
            const detail = parsed?.error?.message || parsed?.error || data.slice(0, 300) || `HTTP ${res.statusCode}`;
            const err = new Error(`Request failed (${res.statusCode}): ${detail}`);
            err.statusCode = res.statusCode;
            return reject(err);
          }
          resolve(parsed);
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Request timed out'));
    });

    const onAbort = () => req.destroy(new Error('Request aborted by user'));
    if (signal) {
      if (signal.aborted) { req.destroy(new Error('Request aborted by user')); return reject(new Error('Aborted')); }
      signal.addEventListener('abort', onAbort, { once: true });
    }

    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

function _parseArgs(raw) {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw || {};
}

// Runs one non-streaming tool-calling round for the given provider family.
// Returns { messages, toolCalls } where toolCalls = [{ name, args }].
async function runToolRound(provider, providerName, model, messages, { signal, tools = TOOL_DEFINITIONS, executeOptions } = {}) {
  let toolCalls = [];
  let results = [];

  if (providerName === 'ollama') {
    const url = new URL('/api/chat', provider.host);
    const data = await _jsonRequest(url, {
      body: {
        model,
        messages,
        tools,
        stream: false,
        options: { temperature: 0.7, top_p: 0.9 },
      },
      signal,
    });

    const msg = data?.message || {};
    const calls = msg.tool_calls || [];
    if (!calls.length) return { messages, toolCalls, results };

    const assistant = {
      role: 'assistant',
      content: msg.content || '',
      tool_calls: calls,
    };
    const next = [...messages, assistant];
    for (const call of calls) {
      const name = call.function?.name;
      const args = _parseArgs(call.function?.arguments);
      toolCalls.push({ name, args });
      const result = await executeTool(name, args, executeOptions);
      results.push({ name, args, ok: result.ok, output: result.output });
      next.push({ role: 'tool', content: result.output });
    }
    return { messages: next, toolCalls, results };
  }

  if (providerName === 'anthropic') {
    const url = new URL('/messages', provider.baseUrl);
    const systemMessages = messages.filter((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const data = await _jsonRequest(url, {
      headers: {
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: {
        model: model || provider.defaultModel,
        max_tokens: 4096,
        messages: chatMessages.map((m) => ({ role: m.role, content: m.content })),
        ...(systemMessages.length ? { system: systemMessages.map((m) => m.content).join('\n') } : {}),
        tools: anthropicTools(tools),
        stream: false,
      },
      signal,
    });

    const blocks = data?.content || [];
    const toolUses = blocks.filter((b) => b.type === 'tool_use');
    if (!toolUses.length) return { messages, toolCalls, results };

    const next = [...messages, { role: 'assistant', content: blocks }];
    for (const use of toolUses) {
      toolCalls.push({ name: use.name, args: use.input || {} });
      const result = await executeTool(use.name, use.input, executeOptions);
      results.push({ name: use.name, args: use.input || {}, ok: result.ok, output: result.output });
      next.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: use.id, content: result.output }],
      });
    }
    return { messages: next, toolCalls, results };
  }

  // OpenAI-compatible family: openai, gemini, huggingface, lmstudio
  const url = new URL('chat/completions', provider.baseUrl.replace(/\/+$/, '') + '/');
  const data = await _jsonRequest(url, {
    headers: provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {},
    body: {
      model: model || provider.defaultModel,
      messages,
      tools,
      tool_choice: 'auto',
      stream: false,
    },
    signal,
  });

  const msg = data?.choices?.[0]?.message;
  const calls = msg?.tool_calls || [];
  if (!calls.length) return { messages, toolCalls, results };

  const next = [...messages, { role: 'assistant', content: msg.content || null, tool_calls: calls }];
  for (const call of calls) {
    const name = call.function?.name;
    const args = _parseArgs(call.function?.arguments);
    toolCalls.push({ name, args });
    const result = await executeTool(name, args, executeOptions);
    results.push({ name, args, ok: result.ok, output: result.output });
    next.push({ role: 'tool', tool_call_id: call.id, content: result.output });
  }
  return { messages: next, toolCalls, results };
}

async function runToolLoop(provider, providerName, model, messages, { signal, tools = TOOL_DEFINITIONS, executeOptions } = {}) {
  let current = messages;
  let allResults = [];
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const result = await runToolRound(provider, providerName, model, current, { signal, tools, executeOptions });
    current = result.messages;
    allResults = allResults.concat(result.results || []);
    if (!result.toolCalls.length) break;
  }
  return { messages: current, results: allResults };
}

module.exports = { TOOL_DEFINITIONS, executeTool, runCommand, runToolLoop };
