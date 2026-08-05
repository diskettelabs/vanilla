'use strict';

const path = require('node:path');
const { EventEmitter } = require('node:events');

const CONFIG = require('../config/default.json');

const feedURL =
  process.env.VANILLA_UPDATE_FEED || (CONFIG.update && CONFIG.update.feedUrl) || '';

// Only require('electron') when we're actually running under gelectron/Electron.
// In plain Node (node server.js) the npm `electron` package would try to
// download its binary, so we bail out before touching it.
function isGelectronContext() {
  return (
    process.env.GELECTRON_NATIVE === '1' ||
    process.env.VANILLA_PACKAGED === '1' ||
    typeof process.versions.electron === 'string'
  );
}

function loadElectron() {
  if (!isGelectronContext()) return null;
  try {
    const electron = require('electron');
    return typeof electron === 'object' && electron ? electron : null;
  } catch (e) {
    return null;
  }
}

function loadAppVersion() {
  const electron = loadElectron();
  try {
    const v = electron && typeof electron.app.getVersion === 'function' && electron.app.getVersion();
    if (v) return v;
  } catch (e) {
    // fall through
  }
  try {
    const pkg = JSON.parse(
      require('node:fs').readFileSync(path.join(__dirname, '..', 'gelectron', 'package.json'), 'utf8')
    );
    if (pkg.version) return pkg.version;
  } catch (e) {
    // fall through
  }
  return '0.0.0';
}

class Updater extends EventEmitter {
  constructor() {
    super();
    this.autoUpdater = null;
    this.supported = false;
    this.reason = '';
    this.status = 'idle';
    this.updateInfo = null;
    this.progress = null;
    this.error = null;
    this._inFlight = null;

    const packaged = process.env.VANILLA_PACKAGED === '1';
    const electron = loadElectron();
    this.autoUpdater = packaged && electron && electron.autoUpdater ? electron.autoUpdater : null;

    if (!this.autoUpdater) {
      this.supported = false;
      this.reason = packaged
        ? 'The autoUpdater module is not available in this build.'
        : 'Update checking is only available in the packaged desktop app.';
      return;
    }

    if (!feedURL) {
      this.supported = false;
      this.reason = 'No update feed is configured (set VANILLA_UPDATE_FEED or config update.feedUrl).';
      return;
    }

    this.supported = true;
    this._wire();
  }

  _wire() {
    const au = this.autoUpdater;
    au.setFeedURL(feedURL);
    au.autoDownload = false;
    au.autoInstallOnAppQuit = false;

    au.on('checking-for-update', () => {
      this.status = 'checking';
      this.emit('change', this.getStatus());
    });
    au.on('update-available', (info) => {
      this.updateInfo = info || null;
      this.status = 'available';
      this.emit('change', this.getStatus());
    });
    au.on('update-not-available', () => {
      this.status = 'not-available';
      this.emit('change', this.getStatus());
    });
    au.on('download-progress', (p) => {
      this.progress = p || null;
      this.status = 'downloading';
      this.emit('change', this.getStatus());
    });
    au.on('update-downloaded', (info) => {
      this.updateInfo = info || null;
      this.progress = { percent: 100 };
      this.status = 'downloaded';
      this.emit('change', this.getStatus());
    });
    au.on('error', (err) => {
      this.error = err && err.message ? err.message : String(err);
      this.status = 'error';
      this.emit('change', this.getStatus());
    });
  }

  getStatus() {
    return {
      supported: this.supported,
      reason: this.reason || undefined,
      status: this.status,
      feedURL,
      currentVersion: loadAppVersion(),
      updateInfo: this.updateInfo,
      progress: this.progress,
      error: this.error || undefined,
    };
  }

  async check() {
    if (!this.autoUpdater) return this.getStatus();
    this.error = null;
    if (!this._inFlight) {
      this._inFlight = this.autoUpdater.checkForUpdates().finally(() => {
        this._inFlight = null;
      });
    }
    await this._inFlight;
    return this.getStatus();
  }

  async download() {
    if (!this.autoUpdater) return this.getStatus();
    if (this.status !== 'available' && !this.updateInfo) {
      this.error = 'No update available to download.';
      return this.getStatus();
    }
    this.error = null;
    if (!this._downloadInFlight) {
      this._downloadInFlight = this.autoUpdater.downloadUpdate().finally(() => {
        this._downloadInFlight = null;
      });
    }
    try {
      await this._downloadInFlight;
    } catch (e) {
      this.error = e && e.message ? e.message : String(e);
      this.status = 'error';
    }
    return this.getStatus();
  }

  install() {
    if (!this.autoUpdater) return { ok: false, error: this.reason };
    try {
      this.autoUpdater.quitAndInstall();
      return { ok: true };
    } catch (e) {
      this.error = e && e.message ? e.message : String(e);
      return { ok: false, error: this.error };
    }
  }
}

const updater = new Updater();

module.exports = { updater };
