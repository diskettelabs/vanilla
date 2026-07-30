const providers = require('./providers');
const storage = require('./storage');
const system = require('./system');
const uploads = require('./upload');
const tools = require('./tools');

const CONFIG = require('../config/default.json');

const activeStreams = new Map();
const TOOL_CALL_RE = /<TOOL_CALL>\s*(\{[\s\S]*?\})\s*<\/TOOL_CALL>/;

function register(app) {
  // File upload
  app.post('/api/upload', (req, res, next) => {
    uploads.upload.single('file')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 10MB)' });
        if (err.message?.startsWith('Unsupported file type')) return res.status(415).json({ error: err.message });
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  }, async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    try {
      const result = await uploads.processUpload(req.file);
      res.status(201).json(result);
    } catch (e) {
      const status = e.statusCode || 500;
      res.status(status).json({ error: e.message });
    }
  });
  // Health
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // System stats
  app.get('/api/system/stats', (_req, res) => {
    try {
      res.json(system.getStats());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Providers
  app.get('/api/providers', (_req, res) => {
    res.json(providers.getProviderNamesWithLabels());
  });

  // Models
  app.get('/api/models', async (_req, res) => {
    const providerName = _req.query.provider || CONFIG.defaultProvider || 'ollama';
    try {
      const provider = providers.create(providerName, CONFIG.providers?.[providerName]);
      const models = await provider.listChatModels();
      res.json(models);
    } catch (e) {
      res.status(503).json({ error: e.message });
    }
  });

  // Conversations
  app.get('/api/conversations', (_req, res) => {
    res.json(storage.list());
  });

  app.post('/api/conversations', (req, res) => {
    const { title, model, provider } = req.body || {};
    const conv = storage.create(title, model, provider);
    res.status(201).json(conv);
  });

  app.get('/api/conversations/:id', (req, res) => {
    const conv = storage.get(req.params.id);
    if (!conv) return res.status(404).json({ error: 'not found' });
    res.json(conv);
  });

  app.delete('/api/conversations/:id', (req, res) => {
    storage.remove(req.params.id);
    res.json({ ok: true });
  });

  // Erase last assistant response
  app.post('/api/conversations/:id/erase-last-response', (req, res) => {
    const conv = storage.eraseLastAssistant(req.params.id);
    if (!conv) return res.status(404).json({ error: 'not found' });
    res.json(conv);
  });

  // Regenerate: replace last user message, remove last assistant, re-trigger
  app.post('/api/conversations/:id/regenerate', (req, res) => {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message is required' });
    const conv = storage.replaceLastUserMessage(req.params.id, message);
    if (!conv) return res.status(404).json({ error: 'not found' });
    storage.eraseLastAssistant(req.params.id);
    res.json(storage.get(req.params.id));
  });

  // Search conversations
  app.get('/api/search', (req, res) => {
    const q = req.query.q;
    if (!q) return res.json([]);
    res.json(storage.search(q));
  });

  // List available tools
  app.get('/api/tools', (_req, res) => {
    res.json(tools.getToolDefs());
  });

  // Execute a tool call
  app.post('/api/tools/execute', async (req, res) => {
    const { name, arguments: args } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Tool name required' });
    try {
      const result = await tools.execToolCall(name, args);
      res.json({ result, name });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Stop an active stream
  app.post('/api/chat/stop/:conversationId', (req, res) => {
    const controller = activeStreams.get(req.params.conversationId);
    if (!controller) return res.status(404).json({ error: 'no active stream' });
    controller.abort();
    activeStreams.delete(req.params.conversationId);
    res.json({ ok: true });
  });

  // Streaming chat (with tool loop support)
  app.post('/api/chat/stream', async (req, res) => {
    const { conversationId, message, model, provider: providerName } = req.body || {};
    if (!conversationId || !message) {
      return res.status(400).json({ error: 'conversationId and message are required' });
    }

    let conv = storage.get(conversationId);
    if (!conv) return res.status(404).json({ error: 'conversation not found' });

    const effectiveProvider = providerName || conv.provider || CONFIG.defaultProvider || 'ollama';
    const effectiveModel = model || conv.model || 'llama2';

    let provider;
    try {
      provider = providers.create(effectiveProvider, CONFIG.providers?.[effectiveProvider]);
    } catch (e) {
      return res.status(400).json({ error: `Unknown provider: ${effectiveProvider}` });
    }

    // Save user message
    storage.addMessage(conversationId, 'user', message);
    conv = storage.get(conversationId);

    // Build messages array (strip internal ids), prepend tool system prompt
    const chatMessages = conv.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const toolDefs = tools.getToolDefs();
    if (toolDefs.length) {
      chatMessages.unshift({ role: 'system', content: tools.buildToolsSystemMessage(toolDefs) });
    }

    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const abortController = new AbortController();
    activeStreams.set(conversationId, abortController);

    const cleanup = () => {
      activeStreams.delete(conversationId);
    };

    async function streamOnce(msgs) {
      return new Promise((resolve, reject) => {
        let content = '';
        provider.chatStream(
          msgs,
          effectiveModel,
          (token) => {
            content += token;
            res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
          },
          () => resolve(content),
          (err) => reject(err),
          { signal: abortController.signal }
        );
      });
    }

    const MAX_TOOL_LOOPS = 5;
    let finalContent = '';
    let loopIndex = 0;

    try {
      while (loopIndex++ < MAX_TOOL_LOOPS) {
        const fullContent = await streamOnce(chatMessages);

        const tcMatch = fullContent.match(TOOL_CALL_RE);
        if (!tcMatch) {
          finalContent = fullContent;
          break;
        }

        let tc;
        try {
          tc = JSON.parse(tcMatch[1]);
        } catch {
          finalContent = fullContent;
          break;
        }

        res.write(`data: ${JSON.stringify({ type: 'tool_call', name: tc.name, arguments: tc.arguments })}\n\n`);

        try {
          const result = await tools.execToolCall(tc.name, tc.arguments);
          res.write(`data: ${JSON.stringify({ type: 'tool_result', name: tc.name, result })}\n\n`);

          const cleanContent = fullContent.replace(TOOL_CALL_RE, '').trim();
          if (cleanContent) {
            chatMessages.push({ role: 'assistant', content: cleanContent });
            storage.addMessage(conversationId, 'assistant', cleanContent, effectiveModel);
          }
          chatMessages.push({ role: 'tool', content: result });
        } catch (e) {
          res.write(`data: ${JSON.stringify({ type: 'tool_error', name: tc.name, error: e.message })}\n\n`);
          chatMessages.push({ role: 'tool', content: `Error: ${e.message}` });
        }
      }

      cleanup();
      if (finalContent) {
        storage.addMessage(conversationId, 'assistant', finalContent, effectiveModel);
      }
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();

    } catch (e) {
      cleanup();
      const msg = e.message || String(e);
      if (msg === 'Stream aborted by user') {
        if (finalContent) {
          storage.addMessage(conversationId, 'assistant', finalContent + '\n[interrupted]', effectiveModel);
        }
        res.write(`data: ${JSON.stringify({ type: 'done', interrupted: true })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`);
        if (finalContent) {
          storage.addMessage(conversationId, 'assistant', finalContent + '\n[interrupted]', effectiveModel);
        }
      }
      if (!res.writableEnded) res.end();
    }
  });
}

module.exports = { register };
