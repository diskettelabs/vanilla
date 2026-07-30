const express = require('express');
const path = require('node:path');
const storage = require('./src/storage');
const routes = require('./src/routes');
const providers = require('./src/providers');
const CONFIG = require('./config/default.json');

storage.init();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/ui', express.static(path.join(__dirname, 'ui')));
app.use('/themes', express.static(path.join(__dirname, 'themes')));

routes.register(app);

app.listen(CONFIG.port, () => {
  console.log(`Vanilla Chat running at http://localhost:${CONFIG.port}`);
  console.log(`Available providers: ${providers.listProviders().join(', ')}`);
});
