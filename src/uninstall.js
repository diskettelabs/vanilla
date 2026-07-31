const fs = require('node:fs');
const path = require('node:path');
const CONFIG = require('../config/default.json');
const lifecycle = require('./lifecycle');

function removeRecursive(target, label) {
  if (!target) return;
  try {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`[Uninstall] Removed ${label}: ${target}`);
  } catch (e) {
    console.error(`[Uninstall] Could not remove ${label} (${target}):`, e.message);
  }
}

async function runUninstall() {
  console.log('[Uninstall] Starting uninstall…');

  const handler = lifecycle.getUninstallHandler();
  if (handler) {
    try {
      await handler();
    } catch (e) {
      console.error('[Uninstall] Cleanup handler error:', e.message);
    }
  }

  if (process.env.VANILLA_PACKAGED === '1') {
    removeRecursive(process.env.VANILLA_USER_DATA, 'user data');
    removeRecursive(process.env.VANILLA_APP_PATH, 'application');
  } else {
    removeRecursive(process.env.VANILLA_OLLAMA_DIR, 'bundled Ollama runtime');
    removeRecursive(path.resolve(CONFIG.storage.dir, '..'), 'app data');
  }

  setTimeout(() => {
    console.log('[Uninstall] Done. Goodbye!');
    process.exit(0);
  }, 200);
}

module.exports = { runUninstall };
