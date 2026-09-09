const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  onCommand: (callback) => ipcRenderer.on('app-command', (_event, command) => callback(command)),
  notify: (title, body) => ipcRenderer.send('show-notification', { title, body }),
  setAppIcon: (dataUrl) => ipcRenderer.send('set-app-icon', dataUrl),
});
