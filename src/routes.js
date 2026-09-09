const providers = require('./providers');
const storage = require('./storage');
const system = require('./system');
const uploads = require('./upload');
const hf = require('./huggingface');
const titles = require('./titles');
const ollama = require('./ollama-models');
const uninstall = require('./uninstall');
const { searchWeb } = require('./search');
const workspace = require('./workspace');
const settings = require('./settings');
const { TOOL_DEFINITIONS, executeTool, runToolLoop } = require('./tools');
const { updater } = require('./updater');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { formatErrorForClient, formatErrorForLog, parseError } = require('./errors');

const CONFIG = require('../config/default.json');

const activeStreams = new Map();
const THEMES_DIR = path.join(__dirname, '..', 'themes');

function prepareVisionMessages(messages, providerName) {
  const mimeByExtension = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif' };
  return messages.map((message) => {
    if (message.role !== 'user' || typeof message.content !== 'string') return message;
    const markers = [...message.content.matchAll(/\[Image:\s*(\/uploads\/[^\]\s]+)\]/g)];
    if (!markers.length) return message;
    const images = [];
    for (const marker of markers) {
      let filename;
      try { filename = path.basename(decodeURIComponent(marker[1].slice('/uploads/'.length))); }
      catch { continue; }
      const file = path.join(uploads.UPLOAD_DIR, filename);
      if (!fs.existsSync(file)) continue;
      const mime = mimeByExtension[path.extname(filename).toLowerCase()];
      if (!mime) continue;
      images.push({ mime, data: fs.readFileSync(file).toString('base64') });
    }
    if (!images.length) return message;
    const text = message.content.replace(/\n*\[Image:\s*\/uploads\/[^\]\s]+\]/g, '').trim() || 'Describe this image.';
    if (providerName === 'ollama') return { ...message, content: text, images: images.map((image) => image.data) };
    if (providerName === 'anthropic') {
      return { ...message, content: [
        { type: 'text', text },
        ...images.map((image) => ({ type: 'image', source: { type: 'base64', media_type: image.mime, data: image.data } })),
      ] };
    }
    return { ...message, content: [
      { type: 'text', text },
      ...images.map((image) => ({ type: 'image_url', image_url: { url: `data:${image.mime};base64,${image.data}` } })),
    ] };
  });
}

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

  // Persistent, device-wide UI preferences. Secrets remain browser-local.
  app.get('/api/settings', (_req, res) => res.json({ settings: settings.read() }));
  app.put('/api/settings', (req, res) => {
    try {
      res.json({ settings: settings.write(req.body?.settings || req.body || {}) });
    } catch (e) {
      res.status(500).json(formatErrorForClient(e, {
        userMessage: 'Failed to save settings',
        action: 'Check that the Vanilla data directory is writable.',
      }));
    }
  });

  app.get('/api/icon', (_req, res) => res.json({ icon: settings.read().customIcon || null }));
  app.put('/api/icon', (req, res) => {
    const icon = req.body?.icon || '';
    const clean = settings.sanitize({ customIcon: icon });
    if (icon && !clean.customIcon) {
      return res.status(400).json({ error: 'Icon must be a base64 PNG, JPEG, WebP, or SVG data URL.' });
    }
    res.json({ icon: settings.write({ customIcon: clean.customIcon || '' }).customIcon || null });
  });

  // Public tool discovery/execution API for clients and provider integrations.
  app.get('/api/tools', (_req, res) => res.json({ tools: TOOL_DEFINITIONS }));
  app.post('/api/tools/execute', async (req, res) => {
    const { name, arguments: args, args: alternateArgs } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Tool name is required', recoverable: true });
    }
    if (!TOOL_DEFINITIONS.some((tool) => tool.function.name === name)) {
      return res.status(404).json({ error: `Unknown tool: ${name}`, recoverable: true });
    }
    try {
      const result = await executeTool(name, args ?? alternateArgs ?? {});
      res.status(result.ok ? 200 : 400).json({ name, ...result });
    } catch (e) {
      res.status(502).json(formatErrorForClient(e));
    }
  });

  // Theme catalog: list available theme JSON files in themes/
  app.get('/api/themes', (_req, res) => {
    try {
      const themes = fs
        .readdirSync(THEMES_DIR)
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace(/\.json$/, ''))
        .map((name) => {
          try {
            const data = JSON.parse(fs.readFileSync(path.join(THEMES_DIR, `${name}.json`), 'utf8'));
            return {
              name,
              displayName: data.displayName || name,
              description: data.description || '',
              version: data.version || '1.0.0',
              author: data.author || '',
              accent: data.accent || '',
              hasLogo: Boolean(data.logo),
              hasMascot: Boolean(data.mascot),
            };
          } catch {
            return { name, displayName: name, description: '' };
          }
        });
      res.json({ themes });
    } catch (e) {
      res.status(500).json({ error: 'Failed to read the themes directory', details: e.message });
    }
  });

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

  // Ollama: browse the curated Ollama library (no public registry JSON API)
  app.get('/api/ollama/library', async (req, res) => {
    try {
      const results = await ollama.searchLibrary(req.query.q || '');
      res.set('Cache-Control', 'public, max-age=300');
      res.json({ results });
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });

  // Ollama: names of locally installed models
  app.get('/api/ollama/tags', async (_req, res) => {
    try {
      const names = await ollama.listInstalled();
      res.json({ names });
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });

  // Ollama: pull a model from the registry (SSE progress)
  app.post('/api/ollama/pull', async (req, res) => {
    const model = String((req.body && req.body.model) || '').trim();
    if (!model) return res.status(400).json({ error: 'model is required' });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    try {
      for await (const event of ollama.pullModel(undefined, model)) {
        const { status, total, completed, digest } = event;
        res.write(`data: ${JSON.stringify({ type: 'status', status, total: total || 0, completed: completed || 0, digest: digest || null })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ type: 'done', model })}\n\n`);
    } catch (e) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`);
    }
    res.end();
  });

  // Conversations
  app.get('/api/conversations', (_req, res) => {
    res.json(storage.list());
  });

  // Recently deleted (recoverable) conversations
  app.get('/api/conversations/deleted', (_req, res) => {
    res.json(storage.listDeleted(CONFIG.storage?.deletedRetentionDays || 30));
  });

  app.get('/api/conversations/deleted/:id', (req, res) => {
    const conv = storage.getDeleted(req.params.id);
    if (!conv) {
      return res.status(404).json({
        error: 'Deleted conversation not found',
        action: 'This conversation may have already been permanently deleted.',
        recoverable: false,
      });
    }
    res.json(conv);
  });

  // Restore a deleted conversation before its retention window ends
  app.post('/api/conversations/:id/restore', (req, res) => {
    try {
      const conv = storage.restore(req.params.id);
      if (!conv) {
        return res.status(404).json({
          error: 'Deleted conversation not found',
          action: 'This conversation may have already been permanently deleted.',
          recoverable: false,
        });
      }
      res.json({ ok: true, conversation: conv });
    } catch (e) {
      console.error('[Restore Error]', formatErrorForLog(e, {
        endpoint: '/api/conversations/:id/restore',
        conversationId: req.params.id,
      }));
      res.status(500).json(formatErrorForClient(e));
    }
  });

  // Delete a conversation for good, skipping the recently-deleted window
  app.delete('/api/conversations/:id/permanent', (req, res) => {
    try {
      const removed = storage.permanentDelete(req.params.id);
      res.json({ ok: true, removed });
    } catch (e) {
      console.error('[Permanent Delete Error]', formatErrorForLog(e, {
        endpoint: '/api/conversations/:id/permanent',
        conversationId: req.params.id,
      }));
      res.status(500).json(formatErrorForClient(e));
    }
  });

  app.post('/api/conversations', (req, res) => {
    const { title, model, provider, autoTitle } = req.body || {};
    const conv = storage.create(title, model, provider, { autoTitle });
    res.status(201).json(conv);
  });

  // Import conversations from exported markdown/JSON files
  app.post('/api/conversations/import', (req, res) => {
    const { files } = req.body || {};
    if (!Array.isArray(files) || !files.length) {
      return res.status(400).json({
        error: 'No files provided',
        action: 'Select at least one markdown or JSON file to import.',
        recoverable: true,
      });
    }
    try {
      const created = storage.importConversations(files);
      if (!created.length) {
        return res.status(400).json({
          error: 'No valid conversations found',
          action: 'The file(s) did not contain a readable conversation.',
          recoverable: true,
        });
      }
      res.json({ imported: created.length, conversations: created });
    } catch (e) {
      console.error('[Import Error]', formatErrorForLog(e, { endpoint: '/api/conversations/import' }));
      res.status(500).json(formatErrorForClient(e, {
        userMessage: 'Failed to import conversations',
        action: 'The file(s) could not be parsed. Try a file exported from Vanilla.',
      }));
    }
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
    try {
      const retentionDays = Number(req.query.retentionDays) || CONFIG.storage?.deletedRetentionDays || 30;
      const deleted = storage.softDelete(req.params.id, retentionDays);
      if (!deleted) {
        return res.status(404).json({
          error: 'Conversation not found',
          action: 'This conversation may already have been deleted.',
          recoverable: false,
        });
      }
      res.json({ ok: true, deletedAt: deleted.deletedAt, retentionDays: deleted.retentionDays, expiresAt: new Date(new Date(deleted.deletedAt).getTime() + deleted.retentionDays * 86400000).toISOString() });
    } catch (e) {
      console.error('[Delete Conversation Error]', formatErrorForLog(e, {
        endpoint: '/api/conversations/:id',
        conversationId: req.params.id,
      }));
      res.status(500).json(formatErrorForClient(e));
    }
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

  // Toggle pinned state for a conversation
  app.patch('/api/conversations/:id/pin', (req, res) => {
    try {
      const conv = storage.get(req.params.id);
      if (!conv) {
        return res.status(404).json({
          error: 'Conversation not found',
          action: 'This conversation may have been deleted.',
          recoverable: false,
        });
      }
      conv.pinned = !conv.pinned;
      storage.update(conv);
      res.json({ pinned: Boolean(conv.pinned) });
    } catch (e) {
      console.error('[Pin Error]', formatErrorForLog(e, {
        endpoint: '/api/conversations/:id/pin',
        conversationId: req.params.id,
      }));
      res.status(500).json(formatErrorForClient(e));
    }
  });

  // Set the per-conversation custom system prompt ('' clears it)
  app.patch('/api/conversations/:id/prompt', (req, res) => {
    try {
      const conv = storage.get(req.params.id);
      if (!conv) {
        return res.status(404).json({
          error: 'Conversation not found',
          action: 'This conversation may have been deleted.',
          recoverable: false,
        });
      }
      const { prompt } = req.body || {};
      conv.customPrompt = typeof prompt === 'string' ? prompt.trim() : '';
      storage.update(conv);
      res.json({ customPrompt: conv.customPrompt });
    } catch (e) {
      console.error('[Prompt Error]', formatErrorForLog(e, {
        endpoint: '/api/conversations/:id/prompt',
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

  // Regenerate from an edited prompt on a new branch, preserving the original path.
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
      const conv = storage.branchFromUserMessage(req.params.id, messageId, message);
      if (!conv) {
        return res.status(404).json({
          error: 'Conversation not found',
          action: 'This conversation may have been deleted.',
          recoverable: false,
        });
      }
      res.json(storage.get(req.params.id));
    } catch (e) {
      console.error('[Regenerate Error]', formatErrorForLog(e, { 
        endpoint: '/api/conversations/:id/regenerate',
        conversationId: req.params.id 
      }));
      res.status(500).json(formatErrorForClient(e));
    }
  });

  app.post('/api/conversations/:id/branches/:branchId/activate', (req, res) => {
    try {
      const conv = storage.switchBranch(req.params.id, req.params.branchId);
      if (conv === null) return res.status(404).json({ error: 'Conversation not found' });
      if (conv === false) return res.status(404).json({ error: 'Branch not found' });
      res.json(conv);
    } catch (e) {
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

  // Multi-model comparison: stream the same prompt from several models in parallel.
  // Events are tagged with an `id` so the client can route tokens to each column.
  app.post('/api/chat/compare', async (req, res) => {
    const { id, message, customPrompt, models } = req.body || {};
    if (!id || !message || !Array.isArray(models) || models.length < 2) {
      return res.status(400).json({
        error: 'Missing comparison parameters',
        action: 'Provide a message and at least two models to compare.',
        recoverable: true,
      });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const abortController = new AbortController();
    activeStreams.set(`compare:${id}`, abortController);
    const cleanup = () => activeStreams.delete(`compare:${id}`);
    res.on('close', () => abortController.abort());

    const chatMessages = [];
    if (customPrompt && customPrompt.trim()) {
      chatMessages.push({ role: 'system', content: customPrompt.trim() });
    }
    chatMessages.push({ role: 'user', content: message });

    const write = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);

    try {
      await Promise.all(models.map(async (entry) => {
        const key = entry.id || `${entry.provider}:${entry.model}`;
        let provider;
        try {
          provider = providers.create(entry.provider, mergeConfig(entry.provider, entry.apiKey));
        } catch (e) {
          write({ type: 'error', id: key, error: `Provider "${entry.provider}" is not available` });
          return;
        }
        let full = '';
        try {
          await provider.chatStream(
            chatMessages,
            entry.model,
            (token) => {
              full += token;
              write({ type: 'token', id: key, content: token });
            },
            () => write({ type: 'done', id: key }),
            (err) => {
              if (err?.name === 'AbortError' || err?.message === 'Stream aborted by user') {
                write({ type: 'done', id: key, interrupted: true });
                return;
              }
              const parsed = parseError(err, { provider: entry.provider, model: entry.model });
              write({ type: 'error', id: key, ...formatErrorForClient(parsed) });
            },
            { signal: abortController.signal }
          );
        } catch (e) {
          if (e?.name === 'AbortError' || e?.message === 'Stream aborted by user') {
            write({ type: 'done', id: key, interrupted: true });
          } else {
            const parsed = parseError(e, { provider: entry.provider, model: entry.model });
            write({ type: 'error', id: key, ...formatErrorForClient(parsed) });
          }
        }
      }));
    } finally {
      cleanup();
      res.end();
    }
  });

  // Stop an active comparison
  app.post('/api/chat/compare-stop/:id', (req, res) => {
    const controller = activeStreams.get(`compare:${req.params.id}`);
    if (!controller) {
      return res.status(404).json({
        error: 'No active comparison',
        action: 'The comparison has already completed or was never started.',
        recoverable: false,
      });
    }
    controller.abort();
    activeStreams.delete(`compare:${req.params.id}`);
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

  // Web search (test endpoint; the stream route also searches inline)
  app.get('/api/websearch', async (req, res) => {
    const query = (req.query.q || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Missing query', action: 'Pass ?q=your search query' });
    }
    const backend = req.query.backend || 'duckduckgo';
    const apiKey = req.query.key || '';
    try {
      const results = await searchWeb(query, { backend, apiKey });
      res.json({ backend, results });
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
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

    // Edited prompts are already saved as the first message on their new branch.
    if (!req.body?.messageAlreadySaved) storage.addMessage(conversationId, 'user', message);

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

    // Web search: fetch results for the latest user message and inject as context
    if (req.body?.search && chatMessages.length > 0) {
      const last = chatMessages[chatMessages.length - 1];
      if (last.role === 'user' && typeof last.content === 'string' && last.content.trim()) {
        const backend = req.body.searchBackend || 'duckduckgo';
        const searchKey = req.body.searchApiKey || '';
        const query = last.content.trim();
        let results = [];
        try {
          results = await searchWeb(query, { backend, apiKey: searchKey });
        } catch (e) {
          console.error('[Search Error]', e.message);
        }
        if (results.length > 0) {
          console.error(`[Search] ${backend}: ${results.length} results injected for "${query.slice(0, 60)}"`);
          const context = `Web search results for "${query.slice(0, 300)}":\n\n${results
            .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`)
            .join('\n\n')}\n\nUse these results to answer the user's question when relevant, and cite sources by their numbers. If the results don't cover the question, say so rather than guessing.`;
          chatMessages.splice(chatMessages.length - 1, 0, { role: 'system', content: context });
        }
      }
    }

    // Turn uploaded image markers into each provider's native vision message format.
    chatMessages = prepareVisionMessages(chatMessages, effectiveProvider);

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

    // Workspace tool calling: let the model create/read/delete files mid-chat
    if (req.body?.workspaceTools || req.body?.tools) {
      try {
        const hint = {
          role: 'system',
          content: 'Tools are enabled. You can search the current web and create, read, list, or delete files in the user\'s workspace directory. Call web_search for current or source-dependent questions. When the user asks to make, save, write, create, open, or delete a file, call the matching workspace tool instead of only describing the action. Images attached by the user are included in their message; inspect them with the provider\'s vision capability when available.',
        };
        const result = await runToolLoop(provider, effectiveProvider, effectiveModel, [hint, ...chatMessages], {
          signal: abortController.signal,
        });
        for (const call of result.results) {
          res.write(`data: ${JSON.stringify({ type: 'tool_call', name: call.name, args: call.args })}\n\n`);
          res.write(`data: ${JSON.stringify({ type: 'tool_result', name: call.name, ok: call.ok, output: call.output })}\n\n`);
        }
        chatMessages = result.messages;
      } catch (e) {
        console.error('[Workspace Tool Error]', formatErrorForLog(e, {
          endpoint: '/api/chat/stream',
          provider: effectiveProvider,
          model: effectiveModel,
        }));
        res.write(`data: ${JSON.stringify({ type: 'tool_error', error: e.message || String(e) })}\n\n`);
      }
    }

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

  // Workspace file management
  app.get('/api/workspace', (req, res) => {
    try {
      res.json({ dir: workspace.WORKSPACE_DIR, files: workspace.listFiles() });
    } catch (e) {
      res.status(500).json({ error: e.message || 'Failed to list workspace files' });
    }
  });

  app.post('/api/workspace/open', async (_req, res) => {
    try {
      res.json(await workspace.openFolder());
    } catch (e) {
      res.status(500).json({ error: e.message || 'Failed to open the workspace folder' });
    }
  });

  app.get('/api/workspace/file', (req, res) => {
    try {
      res.json(workspace.readFile(req.query.path));
    } catch (e) {
      res.status(404).json({ error: e.message || 'File not found' });
    }
  });

  app.post('/api/workspace/write', (req, res) => {
    try {
      const { path: filePath, content } = req.body || {};
      if (!filePath) return res.status(400).json({ error: 'Missing file path' });
      res.json(workspace.writeFile(filePath, content));
    } catch (e) {
      res.status(500).json({ error: e.message || 'Failed to write file' });
    }
  });

  app.delete('/api/workspace/file', (req, res) => {
    try {
      res.json(workspace.deleteFile(req.query.path));
    } catch (e) {
      res.status(500).json({ error: e.message || 'Failed to delete file' });
    }
  });

  // App updates (gelectron autoUpdater — packaged apps only)
  app.get('/api/update/status', (_req, res) => {
    res.json(updater.getStatus());
  });

  app.post('/api/update/check', async (_req, res) => {
    try {
      res.json(await updater.check());
    } catch (e) {
      res.status(500).json({ error: e.message || 'Update check failed' });
    }
  });

  app.post('/api/update/download', async (_req, res) => {
    try {
      res.json(await updater.download());
    } catch (e) {
      res.status(500).json({ error: e.message || 'Update download failed' });
    }
  });

  app.post('/api/update/install', (_req, res) => {
    res.json(updater.install());
  });
}

module.exports = { register };
