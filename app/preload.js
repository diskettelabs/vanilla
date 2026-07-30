const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    electron: process.versions.electron || 'gelectron',
    chrome: process.versions.chrome || 'webkit',
  },
});
