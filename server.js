const express = require('express');
const compression = require('compression');
const path = require('node:path');
const fs = require('node:fs');
const storage = require('./src/storage');
const routes = require('./src/routes');
const providers = require('./src/providers');
const system = require('./src/system');
const uploads = require('./src/upload');
const CONFIG = require('./config/default.json');

storage.init();
const purged = storage.purgeExpired(CONFIG.storage?.deletedRetentionDays || 30);
if (purged) console.log(`Purged ${purged} expired recently-deleted conversation(s)`);
fs.mkdirSync(uploads.UPLOAD_DIR, { recursive: true });
system.prewarm();

const app = express();

// Default body cap covers the vast majority of endpoints. Routes that
// genuinely need more (long chat histories, settings with a custom icon,
// imported conversations, workspace writes) install their own parser at
// registration time.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(compression());

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  etag: true,
}));
app.use('/themes', express.static(path.join(__dirname, 'themes'), {
  maxAge: '1h',
  etag: true,
}));
app.use('/uploads', express.static(uploads.UPLOAD_DIR, {
  maxAge: '7d',
  immutable: true,
}));

routes.register(app);

app.start = function () {
  const host = CONFIG.host || '127.0.0.1';
  app.listen(CONFIG.port, host, () => {
    console.log(`Vanilla Chat running at http://${host}:${CONFIG.port}`);
    const active = providers.getProviderNamesWithLabels(CONFIG.providers).filter((p) => !p.requiresKey || p.hasKey);
    console.log(`Available providers: ${active.map((p) => p.label || p.id).join(', ') || '(none — add a key in Settings)'}`);
  });
};

if (require.main === module) {
  app.start();
}

module.exports = app;
