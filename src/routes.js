const providers = require('./providers');
const storage = require('./storage');
const system = require('./system');
const uploads = require('./upload');
const hf = require('./huggingface');
const titles = require('./titles');
const uninstall = require('./uninstall');
const https = require('https');
const { formatErrorForClient, formatErrorForLog, parseError } = require('./errors');

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
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            error: 'File is too large',
            action: 'Maximum file size is 10MB. Compress or resize your file and try again.',
            recoverable: true,
          });
        }
        if (err.message?.startsWith('Unsupported file type')) {
          return res.status(415).json({
            error: err.message,
            action: 'Supported types: images (PNG, JPG, GIF, WebP), documents (PDF, TXT, MD), and code files.',
            recoverable: true,
          });
        }
        return res.status(400).json(formatErrorForClient(err));
      }
      next();
    });
  }, async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        action: 'Select a file to upload.',
        recoverable: true,
      });
    }
    try {
      const result = await uploads.processUpload(req.file);
      res.status(201).json(result);
    } catch (e) {
      console.error('[Upload Error]', formatErrorForLog(e, { endpoint: '/api/upload' }));
      const status = e.statusCode || 500;
      res.status(status).json(formatErrorForClient(e));
    }
  });

  // Health
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // System stats
  app.get('/api/system/stats', (_req, res) => {
    try {
      res.json(system.getStats());
    } catch (e) {
      console.error('[System Stats Error]', formatErrorForLog(e, { endpoint: '/api/system/stats' }));
      res.status(500).json(formatErrorForClient(e, {
        userMessage: 'Failed to retrieve system statistics',
        action: 'System monitoring is unavailable. This won\'t affect chat functionality.',
      }));
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
      console.error('[Model List Error]', formatErrorForLog(e, { 
        endpoint: '/api/models', 
        provider: providerName 
      }));
      
      const parsed = parseError(e, { provider: providerName });
      res.status(parsed.statusCode || 503).json(formatErrorForClient(parsed));
    }
  });

  // HuggingFace: search GGUF models (empty q returns most popular)
  app.get('/api/hf/search', async (req, res) => {
    const q = (req.query.q || '').trim();
    console.log('[Route] /api/hf/search called with q:', JSON.stringify(q));
    try {
      const results = await hf.searchModels(q);
      console.log('[Route] Returning', results.length, 'results to client');
      // Cache for 5 minutes to avoid hammering HF API, but allow fresh data
      res.set('Cache-Control', 'public, max-age=300');
      res.json({ results });
    } catch (e) {
      console.error('[Route] Search error:', e);
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
    const { title, model, provider, autoTitle } = req.body || {};
    const conv = storage.create(title, model, provider, { autoTitle });
    res.status(201).json(conv);
  });

  app.get('/api/conversations/:id', (req, res) => {
    try {
      const conv = storage.get(req.params.id);
      if (!conv) {
        return res.status(404).json({
          error: 'Conversation not found',
          action: 'This conversation may have been deleted. Start a new chat or select a different conversation.',
          recoverable: false,
        });
      }
      res.json(conv);
    } catch (e) {
      console.error('[Load Conversation Error]', formatErrorForLog(e, { 
        endpoint: '/api/conversations/:id',
        conversationId: req.params.id 
      }));
      res.status(500).json(formatErrorForClient(e, {
        userMessage: 'Failed to load conversation',
        action: 'The conversation file may be corrupted. Try another conversation or start a new one.',
      }));
    }
  });

  app.delete('/api/conversations/:id', (req, res) => {
    storage.remove(req.params.id);
    res.json({ ok: true });
  });

  // Pre-download the tiny local model used for auto-naming chats
  app.post('/api/names/prewarm', async (_req, res) => {
    try {
      const host = CONFIG.providers?.ollama?.host;
      const model = await titles.ensureModel(host);
      res.json({ ok: true, model });
    } catch (e) {
      console.error('[Auto-Name Prewarm Error]', e.message);
      res.json({ ok: false, error: e.message });
    }
  });

  // Auto-generate a short title for a conversation using a tiny local model
  app.post('/api/conversations/:id/name', async (req, res) => {
    try {
      const conv = storage.get(req.params.id);
      if (!conv) {
        return res.status(404).json({
          error: 'Conversation not found',
          action: 'This conversation may have been deleted.',
          recoverable: false,
        });
      }
      
      // Check if forced (manual rename) or auto-naming
      const force = req.query.force === 'true';
      
      // Skip if auto-naming is disabled and not forced
      if (!force && (conv.autoTitle === false || !conv.messages || conv.messages.length === 0)) {
        return res.json({ title: conv.title });
      }
      
      const host = CONFIG.providers?.ollama?.host;
      const title = await titles.generateTitle(conv, { host });
      if (!title) return res.json({ title: conv.title });
      conv.title = title;
      
      // Only set autoTitle to false if this was an automatic naming
      if (!force) {
        conv.autoTitle = false;
      }
      
      storage.update(conv);
      res.json({ title });
    } catch (e) {
      console.error('[Auto-Name Error]', formatErrorForLog(e, {
        endpoint: '/api/conversations/:id/name',
        conversationId: req.params.id,
      }));
      res.status(502).json({ error: e.message || 'Failed to generate a title' });
    }
  });

  // Manual rename endpoint - update conversation title directly
  app.patch('/api/conversations/:id/title', (req, res) => {
    try {
      const conv = storage.get(req.params.id);
      if (!conv) {
        return res.status(404).json({
          error: 'Conversation not found',
          action: 'This conversation may have been deleted.',
          recoverable: false,
        });
      }

      const { title } = req.body || {};
      if (typeof title !== 'string') {
        return res.status(400).json({
          error: 'Title is required',
          action: 'Provide a title for the conversation.',
          recoverable: true,
        });
      }

      conv.title = title.trim() || 'Untitled';
      storage.update(conv);
      res.json({ title: conv.title });
    } catch (e) {
      console.error('[Rename Error]', formatErrorForLog(e, {
        endpoint: '/api/conversations/:id/title',
        conversationId: req.params.id,
      }));
      res.status(500).json(formatErrorForClient(e));
    }
  });

  // Erase last assistant response
  app.post('/api/conversations/:id/erase-last-response', (req, res) => {
    try {
      const conv = storage.eraseLastAssistant(req.params.id);
      if (!conv) {
        return res.status(404).json({
          error: 'Conversation not found',
          action: 'This conversation may have been deleted.',
          recoverable: false,
        });
      }
      res.json(conv);
    } catch (e) {
      console.error('[Erase Response Error]', formatErrorForLog(e, { 
        endpoint: '/api/conversations/:id/erase-last-response',
        conversationId: req.params.id 
      }));
      res.status(500).json(formatErrorForClient(e));
    }
  });

  // Regenerate: replace user message and truncate all messages after it, then re-trigger
  app.post('/api/conversations/:id/regenerate', (req, res) => {
    const { message, messageId } = req.body || {};
    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        action: 'Provide a message to regenerate the response.',
        recoverable: true,
      });
    }
    try {
      const conv = storage.replaceLastUserMessage(req.params.id, messageId, message);
      if (!conv) {
        return res.status(404).json({
          error: 'Conversation not found',
          action: 'This conversation may have been deleted.',
          recoverable: false,
        });
      }
      // No need to call eraseLastAssistant - replaceLastUserMessage now truncates everything after
      res.json(storage.get(req.params.id));
    } catch (e) {
      console.error('[Regenerate Error]', formatErrorForLog(e, { 
        endpoint: '/api/conversations/:id/regenerate',
        conversationId: req.params.id 
      }));
      res.status(500).json(formatErrorForClient(e));
    }
  });

  // Search conversations
  app.get('/api/search', (req, res) => {
    const q = req.query.q;
    if (!q) return res.json([]);
    res.json(storage.search(q));
  });

  // Uninstall the app: clean up, remove data, and exit
  app.post('/api/uninstall', (_req, res) => {
    res.json({ ok: true });
    res.on('finish', () => {
      setTimeout(() => {
        uninstall.runUninstall().catch((e) => {
          console.error('[Uninstall Error]', formatErrorForLog(e));
          process.exit(1);
        });
      }, 100);
    });
  });

  // Stop an active stream
  app.post('/api/chat/stop/:conversationId', (req, res) => {
    const controller = activeStreams.get(req.params.conversationId);
    if (!controller) {
      return res.status(404).json({
        error: 'No active stream',
        action: 'The response has already completed or was never started.',
        recoverable: false,
      });
    }
    controller.abort();
    activeStreams.delete(req.params.conversationId);
    res.json({ ok: true });
  });

  // Vosk model proxy (to bypass CORS)
  app.get('/api/vosk-model', (req, res) => {
    const modelUrl = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip';
    
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
      console.error('[Vosk Model Download Error]', formatErrorForLog(err, { endpoint: '/api/vosk-model' }));
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to download speech recognition model',
          action: 'Check your internet connection. The speech recognition feature requires downloading a 40MB model file on first use.',
          recoverable: true,
        });
      }
    });
  });

  // Streaming chat
  app.post('/api/chat/stream', async (req, res) => {
    const { conversationId, message, model, provider: providerName, customPrompt, apiKey } = req.body || {};

    if (!conversationId || !message) {
      return res.status(400).json({
        error: 'Missing required parameters',
        action: 'Both conversationId and message are required.',
        recoverable: true,
      });
    }

    let conv = storage.get(conversationId);
    if (!conv) {
      return res.status(404).json({
        error: 'Conversation not found',
        action: 'This conversation may have been deleted. Start a new chat.',
        recoverable: false,
      });
    }

    const effectiveProvider = providerName || conv.provider || CONFIG.defaultProvider || 'ollama';
    const effectiveModel = model || conv.model || 'llama2';

    let provider;
    try {
      provider = providers.create(effectiveProvider, mergeConfig(effectiveProvider, apiKey));
    } catch (e) {
      console.error('[Provider Creation Error]', formatErrorForLog(e, { 
        endpoint: '/api/chat/stream',
        provider: effectiveProvider 
      }));
      return res.status(400).json({
        error: `Provider "${effectiveProvider}" is not available`,
        action: 'Configure your AI provider in config/default.json. Set up either Ollama (local) or OpenAI (cloud).',
        recoverable: true,
      });
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
            console.error('[Stream Error]', formatErrorForLog(err, { 
              endpoint: '/api/chat/stream',
              provider: effectiveProvider,
              model: effectiveModel 
            }));
            
            const parsed = parseError(err, { provider: effectiveProvider });
            const errorResponse = formatErrorForClient(parsed);
            res.write(`data: ${JSON.stringify({ type: 'error', ...errorResponse })}\n\n`);
            
            if (fullContent) {
              storage.addMessage(conversationId, 'assistant', fullContent + '\n[error: ' + errorResponse.error + ']', effectiveModel);
            }
            res.end();
          }
        },
        { signal: abortController.signal }
      );
    } catch (e) {
      cleanup();
      console.error('[Chat Stream Error]', formatErrorForLog(e, { 
        endpoint: '/api/chat/stream',
        provider: effectiveProvider,
        model: effectiveModel 
      }));
      
      const parsed = parseError(e, { provider: effectiveProvider });
      
      if (!res.headersSent) {
        res.status(parsed.statusCode || 503).json(formatErrorForClient(parsed));
      } else {
        const errorResponse = formatErrorForClient(parsed);
        res.write(`data: ${JSON.stringify({ type: 'error', ...errorResponse })}\n\n`);
        res.end();
      }
    }
  });
}

module.exports = { register };
