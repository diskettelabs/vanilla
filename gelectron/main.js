const { app, BrowserWindow, Menu, shell, dialog, ipcMain, Notification, nativeImage } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { GelectronOllama } = require('gelectron-ollama');

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
process.env.VANILLA_OLLAMA_DIR = path.join(app.getPath('userData'), 'vanilla-chat', 'ollama');
process.env.VANILLA_WHISPER_DIR = path.join(app.getPath('userData'), 'vanilla-chat', 'whisper');
if (IS_PACKAGED) {
  process.env.VANILLA_APP_PATH = path.resolve(APP_ROOT, '..', '..', '..');
}
app.setName('Vanilla');

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
let retrying = false;

function sendCommand(command) {
  mainWindow?.webContents.send('app-command', command);
}

ipcMain.on('show-notification', (_event, { title, body } = {}) => {
  if (Notification.isSupported()) new Notification({ title: title || 'Vanilla', body: body || 'Your response is ready.' }).show();
});

ipcMain.on('set-app-icon', (_event, dataUrl) => {
  const packagedIcon = path.join(__dirname, 'icon.png');
  const defaultIcon = fs.existsSync(packagedIcon) ? packagedIcon : path.join(APP_ROOT, 'logo.png');
  const image = dataUrl ? nativeImage.createFromDataURL(dataUrl) : nativeImage.createFromPath(defaultIcon);
  if (image.isEmpty()) return;
  mainWindow?.setIcon(image);
  if (process.platform === 'darwin' && app.dock) app.dock.setIcon(image);
});

ipcMain.handle('pick-folder', async () => {
  try {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    if (!win || win.isDestroyed()) return null;
    const result = await dialog.showOpenDialog(win, {
      title: 'Choose an agent working directory',
      properties: ['openDirectory', 'createDirectory'],
    });
    return result.canceled || !result.filePaths[0] ? null : result.filePaths[0];
  } catch {
    return null;
  }
});

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
          click: () => sendCommand('new-chat'),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Conversation',
      submenu: [
        { label: 'Search Conversations', accelerator: isMac ? 'Cmd+K' : 'Ctrl+K', click: () => sendCommand('search') },
        { label: 'Focus Message', accelerator: isMac ? 'Cmd+L' : 'Ctrl+L', click: () => sendCommand('focus-message') },
        { label: 'Stop Generating', accelerator: 'Esc', click: () => sendCommand('stop') },
        { type: 'separator' },
        { label: 'Toggle Sidebar', accelerator: isMac ? 'Cmd+B' : 'Ctrl+B', click: () => sendCommand('toggle-sidebar') },
        { label: 'Settings', accelerator: isMac ? 'Cmd+,' : 'Ctrl+,', click: () => sendCommand('settings') },
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
    title: 'Vanilla',
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'hidden',
    ...(process.platform === 'darwin' ? {
      trafficLightPosition: { x: 16, y: 18 },
    } : {
      titleBarOverlay: { color: '#00000000', symbolColor: '#1b1b1b', height: 48 },
    }),
    backgroundColor: '#f8f8f6',
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
  mainWindow.webContents.on('page-title-updated', (event) => {
    event.preventDefault();
    mainWindow?.setTitle('Vanilla');
  });

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
    console.error('Could not start bundled Ollama:', error.message);
    showSplashError(`Could not start bundled Ollama: ${error.message}`);
    startRetryLoop();
    return;
  }

  try {
    await startServer();
  } catch (error) {
    if (error && error.code === 'EADDRINUSE') {
      const isOurs = await probePort(CONFIG.port);
      if (isOurs) {
        console.log(`Port ${CONFIG.port} is already serving Vanilla — opening the running instance.`);
      } else {
        console.error(`Port ${CONFIG.port} is in use by another application.`);
        showSplashError(
          `Port ${CONFIG.port} is already in use by another application (not Vanilla). ` +
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

  const updateConfig = CONFIG.update || {};
  if (updateConfig.autoCheckOnLaunch !== false) {
    const { updater } = require(path.join(APP_ROOT, 'src', 'updater'));
    if (updater.supported) {
      updater.check().catch(() => {});
      console.log(`[Updates] Checking for updates against ${updater.getStatus().feedURL}`);
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(`http://localhost:${CONFIG.port}`);
    }
  });
});

function startRetryLoop() {
  if (retryTimer) return;
  retryTimer = setInterval(async () => {
    if (retrying) return;
    retrying = true;
    try {
      if (!ollamaServer) {
        await ensureOllama();
      }
      await startServer();
      clearInterval(retryTimer);
      retryTimer = null;
      console.log('Startup succeeded after retry.');
      mainWindow.loadURL(`http://localhost:${CONFIG.port}`);
      const updateConfig = CONFIG.update || {};
      if (updateConfig.autoCheckOnLaunch !== false) {
        const { updater } = require(path.join(APP_ROOT, 'src', 'updater'));
        if (updater.supported) updater.check().catch(() => {});
      }
    } catch (error) {
      console.warn('Startup retry pending:', error && error.message);
    } finally {
      retrying = false;
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
