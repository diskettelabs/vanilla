const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { ElectronOllama } = require('electron-ollama');

function appRoot() {
  const parent = path.join(__dirname, '..');
  if (fs.existsSync(path.join(parent, 'server.js'))) return parent;
  return __dirname;
}

const APP_ROOT = appRoot();
const lifecycle = require(path.join(APP_ROOT, 'src', 'lifecycle'));
const IS_PACKAGED = APP_ROOT.includes('.app/Contents') || APP_ROOT.includes('app.asar');
process.chdir(IS_PACKAGED ? app.getPath('userData') : APP_ROOT);

process.env.VANILLA_PACKAGED = IS_PACKAGED ? '1' : '0';
process.env.VANILLA_USER_DATA = app.getPath('userData');
process.env.VANILLA_OLLAMA_DIR = path.join(app.getPath('userData'), 'ollama');
if (IS_PACKAGED) {
  process.env.VANILLA_APP_PATH = path.resolve(APP_ROOT, '..', '..', '..');
}

lifecycle.setUninstallHandler(async () => {
  if (ollamaServer) {
    try {
      ollamaServer.stop();
    } catch (e) {
      console.warn('[Uninstall] Could not stop Ollama:', e.message);
    }
  }
  if (server) {
    try {
      server.close();
    } catch (e) {
      console.warn('[Uninstall] Could not close server:', e.message);
    }
  }
});

const CONFIG = require(path.join(APP_ROOT, 'config', 'default.json'));

const SPLASH_FILE = path.join(__dirname, 'splash.html');

let mainWindow = null;
let server = null;
let ollamaServer = null;
let retryTimer = null;

function updateSplash(percent, message) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.executeJavaScript(
    `updateSplash(${Number.isFinite(percent) ? percent : 0}, ${JSON.stringify(message || '')});`
  ).catch(() => {});
}

function showSplashError(message) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.executeJavaScript(
    `showError(${JSON.stringify(message || '')});`
  ).catch(() => {});
}

function probePort(port) {
  return new Promise((resolve) => {
    const req = http.get(
      { host: 'localhost', port, path: '/', timeout: 3000 },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
          if (body.length > 65536) req.destroy();
        });
        res.on('end', () => resolve(body.includes('vanilla-chat')));
        res.on('error', () => resolve(false));
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function startServer() {
  const expressApp = require(path.join(APP_ROOT, 'server'));
  return new Promise((resolve, reject) => {
    server = http.createServer(expressApp);
    server.once('error', reject);
    server.listen(CONFIG.port, () => resolve());
  });
}

async function ensureOllama() {
  const ollama = new ElectronOllama({
    basePath: path.join(app.getPath('userData'), 'ollama'),
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
          click: () => shell.openExternal('https://github.com/antarasi/electron-ollama'),
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
      preload: path.join(__dirname, 'preload.js'),
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

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file:')) return;
    const action = new URL(url).searchParams.get('action');
    if (!action) return;
    event.preventDefault();
    if (action === 'quit') app.quit();
    if (action === 'retry') retryStartup();
  });

  try {
    await ensureOllama();
  } catch (error) {
    console.warn('Could not start bundled Ollama:', error.message);
  }

  try {
    await startServer();
  } catch (error) {
    if (error && error.code === 'EADDRINUSE') {
      const isOurs = await probePort(CONFIG.port);
      if (isOurs) {
        console.log(`Port ${CONFIG.port} is already serving Vanilla Chat — opening the running instance.`);
      } else {
        console.error(`Port ${CONFIG.port} is in use by another application.`);
        showSplashError(
          `Port ${CONFIG.port} is already in use by another application (not Vanilla Chat). ` +
          `Close the other app or free the port, then press Retry.`
        );
        startRetryLoop();
        return;
      }
    } else {
      console.error('Could not start web server:', error && error.message);
      showSplashError(`Could not start the web server: ${(error && error.message) || error}`);
      startRetryLoop();
      return;
    }
  }

  mainWindow.loadURL(`http://localhost:${CONFIG.port}`);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(`http://localhost:${CONFIG.port}`);
    }
  });
});

function startRetryLoop() {
  if (retryTimer) return;
  retryTimer = setInterval(async () => {
    try {
      await startServer();
      clearInterval(retryTimer);
      retryTimer = null;
      mainWindow.loadURL(`http://localhost:${CONFIG.port}`);
    } catch (error) {
      if (error && error.code !== 'EADDRINUSE') {
        clearInterval(retryTimer);
        retryTimer = null;
        showSplashError(`Could not start the web server: ${(error && error.message) || error}`);
      }
    }
  }, 4000);
}

function retryStartup() {
  if (retryTimer) return;
  startRetryLoop();
}

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
