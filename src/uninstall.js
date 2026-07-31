const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
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

function pgrepPids(pattern) {
  return new Promise((resolve) => {
    execFile('pgrep', ['-f', pattern], { timeout: 5000 }, (err, stdout) => {
      if (err) return resolve([]);
      resolve(stdout.split('\n').map((s) => s.trim()).filter(Boolean));
    });
  });
}

async function killBundledOllama() {
  const basePath = process.env.VANILLA_OLLAMA_DIR;
  if (!basePath) return;
  let pids = await pgrepPids(basePath);
  if (!pids.length) return;
  console.log(`[Uninstall] Stopping Ollama processes: ${pids.join(', ')}`);
  for (const pid of pids) {
    try {
      process.kill(Number(pid), 'SIGTERM');
    } catch {}
  }
  await new Promise((r) => setTimeout(r, 1000));
  pids = await pgrepPids(basePath);
  if (pids.length) {
    console.log(`[Uninstall] Forcing stop of Ollama processes: ${pids.join(', ')}`);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), 'SIGKILL');
      } catch {}
    }
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

  await killBundledOllama();

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
