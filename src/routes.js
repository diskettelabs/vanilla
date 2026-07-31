const providers = require('./providers');
const storage = require('./storage');
const system = require('./system');
const uploads = require('./upload');
const hf = require('./huggingface');
const https = require('https');

const CONFIG = require('../config/default.json');

const activeStreams = new Map();

function mergeConfig(providerName, apiKey) {
  return {
    ...(CONFIG.providers?.[providerName] || {}),
    ...(typeof apiKey === 'string' && apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
  };
}

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
    res.json(providers.getProviderNamesWithLabels(CONFIG.providers));
  });

  // Models
  app.get('/api/models', async (_req, res) => {
    const providerName = _req.query.provider || CONFIG.defaultProvider || 'ollama';
    try {
      const provider = providers.create(providerName, mergeConfig(providerName, _req.query.apiKey));
      const models = await provider.listChatModels();
      res.json(models);
    } catch (e) {
      res.status(503).json({ error: e.message });
    }
  });

  // HuggingFace: search GGUF models
  app.get('/api/hf/search', async (req, res) => {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ results: [] });
    try {
      const results = await hf.searchModels(q);
      res.json({ results });
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });

  // HuggingFace: list GGUF files in a repo
  app.get('/api/hf/repo', async (req, res) => {
    const repo = (req.query.repo || '').trim();
    if (!repo) return res.status(400).json({ error: 'repo is required' });
    try {
      const files = await hf.listModelFiles(repo);
      res.json({ files });
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });

  // HuggingFace: download a GGUF and import into local Ollama (SSE progress)
  app.post('/api/hf/install', async (req, res) => {
    const { repo, file } = req.body || {};
    if (!repo || !file) return res.status(400).json({ error: 'repo and file are required' });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    try {
      for await (const event of hf.installModel(repo, file)) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (e) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`);
    }
    res.end();
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

  // Stop an active stream
  app.post('/api/chat/stop/:conversationId', (req, res) => {
    const controller = activeStreams.get(req.params.conversationId);
    if (!controller) return res.status(404).json({ error: 'no active stream' });
    controller.abort();
    activeStreams.delete(req.params.conversationId);
    res.json({ ok: true });
  });

  // Vosk model proxy (to bypass CORS)
  app.get('/api/vosk-model', (req, res) => {
    const modelUrl = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip';
    
    console.log('Proxying Vosk model download...');
    
    https.get(modelUrl, (proxyRes) => {
      // Set headers
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': 'application/zip',
        'Content-Length': proxyRes.headers['content-length'],
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      });
      
      // Stream the response
      proxyRes.pipe(res);
      
    }).on('error', (err) => {
      console.error('Error downloading Vosk model:', err);
      res.status(500).json({ error: 'Failed to download model' });
    });
  });

  // Streaming chat
  app.post('/api/chat/stream', async (req, res) => {
    const { conversationId, message, model, provider: providerName, customPrompt, apiKey } = req.body || {};
    if (!conversationId || !message) {
      return res.status(400).json({ error: 'conversationId and message are required' });
    }

    let conv = storage.get(conversationId);
    if (!conv) return res.status(404).json({ error: 'conversation not found' });

    const effectiveProvider = providerName || conv.provider || CONFIG.defaultProvider || 'ollama';
    const effectiveModel = model || conv.model || 'llama2';

    let provider;
    try {
      provider = providers.create(effectiveProvider, mergeConfig(effectiveProvider, apiKey));
    } catch (e) {
      return res.status(400).json({ error: `Unknown provider: ${effectiveProvider}` });
    }

    // Save user message
    storage.addMessage(conversationId, 'user', message);

    // Reload conversation to get updated messages
    conv = storage.get(conversationId);

    // Build messages array for provider (strip internal ids)
    let chatMessages = conv.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Prepend custom system prompt if provided
    if (customPrompt && customPrompt.trim()) {
      // Check if there's already a system message at the start
      if (chatMessages.length === 0 || chatMessages[0].role !== 'system') {
        chatMessages = [
          { role: 'system', content: customPrompt.trim() },
          ...chatMessages
        ];
      } else {
        // Replace existing system message with custom one
        chatMessages[0] = { role: 'system', content: customPrompt.trim() };
      }
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
