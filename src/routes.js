const providers = require('./providers');
const storage = require('./storage');

const CONFIG = require('../config/default.json');

const activeStreams = new Map();

function register(app) {
  // Health
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

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

  // Stop an active stream
  app.post('/api/chat/stop/:conversationId', (req, res) => {
    const controller = activeStreams.get(req.params.conversationId);
    if (!controller) return res.status(404).json({ error: 'no active stream' });
    controller.abort();
    activeStreams.delete(req.params.conversationId);
    res.json({ ok: true });
  });

  // Streaming chat
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

    // Reload conversation to get updated messages
    conv = storage.get(conversationId);

    // Build messages array for provider (strip internal ids)
    const chatMessages = conv.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

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

    let fullContent = '';

    try {
      await provider.chatStream(
        chatMessages,
        effectiveModel,
        (token) => {
          fullContent += token;
          res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
        },
        () => {
          cleanup();
          storage.addMessage(conversationId, 'assistant', fullContent, effectiveModel);
          res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
          res.end();
        },
        (err) => {
          cleanup();
          if (err.message === 'Stream aborted by user') {
            if (fullContent) {
              storage.addMessage(conversationId, 'assistant', fullContent + '\n[interrupted]', effectiveModel);
            }
            res.write(`data: ${JSON.stringify({ type: 'done', interrupted: true })}\n\n`);
            res.end();
          } else {
            res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
            if (fullContent) {
              storage.addMessage(conversationId, 'assistant', fullContent + '\n[interrupted]', effectiveModel);
            }
            res.end();
          }
        },
        { signal: abortController.signal }
      );
    } catch (e) {
      cleanup();
      if (!res.headersSent) {
        res.status(503).json({ error: e.message });
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`);
        res.end();
      }
    }
  });
}

module.exports = { register };
