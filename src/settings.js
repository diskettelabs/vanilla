const fs = require('node:fs');
const path = require('node:path');

const CONFIG = require('../config/default.json');
const SETTINGS_FILE = path.join(path.dirname(path.resolve(CONFIG.storage.dir)), 'settings.json');

const ALLOWED_KEYS = new Set([
  'theme', 'density', 'textSize', 'accent', 'sidebar', 'reduceMotion', 'enterToSend',
  'showStats', 'soundEffects', 'ambientMusic', 'musicTrack', 'showCompare',
  'showLmStudio', 'showAider', 'showGoose', 'showOpenCode', 'autoName',
  'assistantLogo', 'userName', 'customPrompt', 'webSearch', 'searchBackend',
  'workspaceTools', 'dictationEngine', 'customIcon', 'desktopNotifications',
  'deletedRetentionDays', 'agentDir',
]);

function sanitize(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const clean = {};
  for (const [key, value] of Object.entries(input)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (!['string', 'boolean', 'number'].includes(typeof value)) continue;
    if (typeof value === 'string' && value.length > 3_000_000) continue;
    if (key === 'customIcon' && value && !/^data:image\/(?:png|jpeg|webp|svg\+xml);base64,/i.test(value)) continue;
    clean[key] = value;
  }
  return clean;
}

function read() {
  try {
    return sanitize(JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')));
  } catch {
    return {};
  }
}

function write(input) {
  const settings = { ...read(), ...sanitize(input) };
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  const temporary = `${SETTINGS_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, SETTINGS_FILE);
  return settings;
}

module.exports = { read, write, sanitize, SETTINGS_FILE };
