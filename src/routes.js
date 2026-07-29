const ollama = require('./ollama');
const storage = require('./storage');

function register(app) {
  // Health
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // Models
  app.get('/api/models', async (_req, res) => {
    try {
      const models = await ollama.listModels();
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
    const { title, model } = req.body || {};
    const conv = storage.create(title, model);
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

  // Streaming chat
  app.post('/api/chat/stream', async (req, res) => {
    const { conversationId, message, model = 'llama2' } = req.body || {};
    if (!conversationId || !message) {
      return res.status(400).json({ error: 'conversationId and message are required' });
    }

    let conv = storage.get(conversationId);
    if (!conv) return res.status(404).json({ error: 'conversation not found' });

    // Save user message
    storage.addMessage(conversationId, 'user', message);

    // Reload conversation to get updated messages
    conv = storage.get(conversationId);

    // Build messages array for Ollama (strip internal ids)
    const ollamaMessages = conv.messages.map((m) => ({
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

    let fullContent = '';

    try {
      await ollama.chatStream(
        ollamaMessages,
        model,
        (token) => {
          fullContent += token;
          res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
        },
        () => {
          // Save assistant message
          storage.addMessage(conversationId, 'assistant', fullContent, model);
          res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
          res.end();
        },
        (err) => {
          res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
          // Save partial content if any
          if (fullContent) {
            storage.addMessage(conversationId, 'assistant', fullContent + '\n[interrupted]', model);
          }
          res.end();
        }
      );
    } catch (e) {
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
