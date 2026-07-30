const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('node:path');
const http = require('node:http');
const { GelectronOllama } = require('gelectron-ollama');
const CONFIG = require('../config/default.json');

let mainWindow = null;
let server = null;
let ollamaServer = null;

async function startOllama() {
  const go = new GelectronOllama({
    basePath: app.getPath('userData'),
  });

  if (await go.isRunning()) {
    console.log('Ollama is already running');
    return;
  }

  console.log('Ollama not detected — downloading and starting...');
  const metadata = await go.getMetadata('latest');
  await go.serve(metadata.version, {
    serverLog: (msg) => console.log('[Ollama]', msg),
    downloadLog: (pct, msg) => console.log('[Ollama]', `${pct}%`, msg),
  });
  ollamaServer = go.getServer();
  console.log(`Ollama ${metadata.version} is now running`);
}

async function startServer() {
  const expressApp = require('../server');
  return new Promise((resolve) => {
    server = http.createServer(expressApp);
    server.listen(CONFIG.port, () => {
      resolve();
    });
  });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Chat',
          accelerator: isMac ? 'Cmd+Shift+O' : 'Ctrl+Shift+O',
          click: () => mainWindow?.webContents.executeJavaScript('document.querySelector(\'[data-action="new-chat"]\')?.click()'),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' },
        ] : [{ role: 'close' }]),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Vanilla Chat Docs',
          click: () => shell.openExternal('https://github.com/milesallen/vanilla-chat'),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    title: 'Vanilla Chat',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.loadURL(`http://localhost:${CONFIG.port}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  buildMenu();
  await startOllama();
  await startServer();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', async () => {
  if (server) {
    server.close();
  }
  if (ollamaServer) {
    await ollamaServer.stop();
  }
});
