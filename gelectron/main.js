const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('node:path');
const http = require('node:http');
const { GelectronOllama } = require('gelectron-ollama');
const CONFIG = require('../config/default.json');

const SPLASH_FILE = path.join(__dirname, 'splash.html');

let mainWindow = null;
let server = null;
let ollamaServer = null;

process.chdir(path.join(__dirname, '..'));

function updateSplash(percent, message) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.executeJavaScript(
    `updateSplash(${Number.isFinite(percent) ? percent : 0}, ${JSON.stringify(message || '')});`
  ).catch(() => {});
}

async function startServer() {
  const expressApp = require('../server');
  return new Promise((resolve, reject) => {
    server = http.createServer(expressApp);
    server.once('error', reject);
    server.listen(CONFIG.port, () => resolve());
  });
}

async function ensureOllama() {
  const ollama = new GelectronOllama({
    basePath: path.join(app.getPath('userData'), 'vanilla-chat', 'ollama'),
  });
  if (await ollama.isRunning()) {
    console.log('Ollama is already running on port 11434');
    return;
  }
  const metadata = await ollama.getMetadata('latest');
  updateSplash(0, `Downloading ${metadata.fileName} (${metadata.sizeMB} MB)`);
  await ollama.serve(metadata.version, {
    serverLog: (message) => console.log('[Ollama]', message),
    downloadLog: (percent, message) => {
      console.log(`[Ollama Download] ${percent}% ${message}`);
      updateSplash(percent, message);
    },
  });
  ollamaServer = ollama.getServer();
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
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
          label: 'Gelectron',
          click: () => shell.openExternal('https://gelectron.milesallen.site/'),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow(url, useLoadFile = false) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    title: 'Vanilla Chat',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  if (useLoadFile) {
    mainWindow.loadFile(url);
  } else {
    mainWindow.loadURL(url);
  }

  const showWhenReady = () => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  };
  mainWindow.once('ready-to-show', showWhenReady);
  mainWindow.webContents.once('did-finish-load', showWhenReady);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  buildMenu();
  await createWindow(SPLASH_FILE, true);

  try {
    await ensureOllama();
  } catch (error) {
    console.warn('Could not start bundled Ollama:', error.message);
  }

  try {
    await startServer();
  } catch (error) {
    if (error && error.code === 'EADDRINUSE') {
      console.error(`Port ${CONFIG.port} is already in use. Another Vanilla Chat instance may be running.`);
    } else {
      console.error('Could not start web server:', error && error.message);
    }
    app.quit();
    return;
  }

  mainWindow.loadURL(`http://localhost:${CONFIG.port}`);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(`http://localhost:${CONFIG.port}`);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (ollamaServer) {
    ollamaServer.stop();
  }
  if (server) {
    server.close();
  }
});
