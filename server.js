const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const storage = require('./src/storage');
const routes = require('./src/routes');
const providers = require('./src/providers');
const uploads = require('./src/upload');
const CONFIG = require('./config/default.json');

storage.init();
fs.mkdirSync(uploads.UPLOAD_DIR, { recursive: true });

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/ui', express.static(path.join(__dirname, 'ui')));
app.use('/themes', express.static(path.join(__dirname, 'themes')));
app.use('/uploads', express.static(uploads.UPLOAD_DIR));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

routes.register(app);

if (require.main === module) {
  app.listen(CONFIG.port, () => {
    console.log(`Vanilla Chat running at http://localhost:${CONFIG.port}`);
    console.log(`Available providers: ${providers.listProviders().join(', ')}`);
  });
}

module.exports = app;
