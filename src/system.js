const os = require('os');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

// Non-blocking probe. Never execSync: this runs on the request path and would
// stall every other connection (including in-flight SSE token streams).
async function _exec(file, args) {
  try {
    const { stdout } = await execFileAsync(file, args, { timeout: 2000, maxBuffer: 4 * 1024 * 1024 });
    return stdout;
  } catch {
    return '';
  }
}

function getCPUInfo() {
  const cpus = os.cpus();
  return {
    model: cpus[0]?.model?.trim() || 'unknown',
    cores: cpus.length,
    architecture: process.arch,
  };
}

function sampleCPUTimes() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    idle += cpu.times.idle;
    total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
  }
  return { idle, total };
}

// CPU usage from os.cpus() deltas against the previous sample. The stats
// poller hits this every few seconds, so the delta window is wide enough to be
// accurate — and it costs zero subprocesses and zero event-loop time.
const MIN_CPU_WINDOW_MS = 250;
let lastCpuSample = null; // { wall, idle, total }
let lastCpuUsage = 0;
let hasCpuReading = false;

function getCPUUsageDelta() {
  const now = sampleCPUTimes();
  const wall = Date.now();
  const prev = lastCpuSample;
  lastCpuSample = { wall, idle: now.idle, total: now.total };
  if (!prev) return null;
  const wallDelta = wall - prev.wall;
  const totalDelta = now.total - prev.total;
  // Too short a window to trust. Reuse the previous reading rather than paying
  // for a subprocess — unless we have never produced a reading at all, in
  // which case the caller needs the external probe to show anything.
  if (wallDelta < MIN_CPU_WINDOW_MS || totalDelta <= 0) return hasCpuReading ? lastCpuUsage : null;
  const usage = (1 - (now.idle - prev.idle) / totalDelta) * 100;
  if (!Number.isFinite(usage)) return hasCpuReading ? lastCpuUsage : null;
  lastCpuUsage = +Math.min(100, Math.max(0, usage)).toFixed(1);
  hasCpuReading = true;
  return lastCpuUsage;
}

// Fallback for the very first call, where there is no previous sample to diff
// against. Async so it never blocks the loop.
async function getCPUUsageExternal() {
  if (process.platform === 'darwin') {
    const out = await _exec('/usr/bin/top', ['-l', '1', '-n', '0', '-stats', 'cpu']);
    const m = out.match(/(\d+[.,]\d+)%\s+user.*?(\d+[.,]\d+)%\s+sys.*?(\d+[.,]\d+)%\s+idle/s);
    if (m) {
      lastCpuUsage = +Math.max(0, 100 - parseFloat(m[3].replace(',', '.'))).toFixed(1);
      hasCpuReading = true;
      return lastCpuUsage;
    }
  }
  return lastCpuUsage;
}

async function getCPUUsage() {
  const delta = getCPUUsageDelta();
  if (delta !== null) return delta;
  return getCPUUsageExternal();
}

function getMemoryInfo() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const usagePercent = +((used / total) * 100).toFixed(1);
  const totalGB = +(total / 1024 ** 3).toFixed(1);
  const usedGB = +(used / 1024 ** 3).toFixed(1);
  let pressure = 'low';
  if (usagePercent > 90) pressure = 'extreme';
  else if (usagePercent > 80) pressure = 'high';
  else if (usagePercent > 60) pressure = 'normal';
  return { physical: { usedGB, totalGB }, pressurePercent: usagePercent, pressure };
}

async function getMemoryPressure() {
  if (process.platform !== 'darwin') return getMemoryInfo();

  const out = await _exec('/usr/bin/memory_pressure', []);
  const pctMatch = out.match(/memory free percentage:\s+(\d+)/i);
  const pressureMatch = out.match(/pressure level:\s+(\w+)/i);
  const freePct = pctMatch ? parseInt(pctMatch[1]) : null;
  const pressurePct = freePct !== null ? 100 - freePct : null;
  const pressureStr = pressureMatch ? pressureMatch[1].toLowerCase() : null;
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const totalGB = +(total / 1024 ** 3).toFixed(1);
  const usedGB = +(used / 1024 ** 3).toFixed(1);
  return {
    physical: { usedGB, totalGB },
    pressurePercent: pressurePct ?? +((used / total) * 100).toFixed(1),
    pressure: pressureStr ?? (pressurePct !== null
      ? (pressurePct > 90 ? 'extreme' : pressurePct > 80 ? 'high' : pressurePct > 60 ? 'normal' : 'low')
      : 'unknown'),
  };
}

// GPU model/VRAM and the NPU brand string are hardware constants — they cannot
// change while the process is alive. system_profiler takes ~230ms to fork and
// parse, so probe once and reuse. Reset by tests via clearHardwareCache().
let gpuCache = null;
let npuCache = null;

async function getGPUInfo() {
  if (gpuCache) return gpuCache;
  if (process.platform !== 'darwin') { gpuCache = []; return gpuCache; }

  const out = await _exec('/usr/sbin/system_profiler', ['SPDisplaysDataType', '-json']);
  if (!out) { gpuCache = []; return gpuCache; }
  try {
    const data = JSON.parse(out);
    const gpus = data.SPDisplaysDataType || [];
    gpuCache = gpus.map((g) => {
      const vramStr = g.vram || g.vram_shared || '';
      const vramMatch = vramStr.match(/([\d.]+)\s*(\w+)/);
      let totalMB = 0;
      if (vramMatch) {
        const val = parseFloat(vramMatch[1]);
        const unit = vramMatch[2].toLowerCase();
        totalMB = unit === 'gb' ? val * 1024 : val;
      }
      return {
        name: g.sppci_model || g._name || 'Unknown GPU',
        chipset: g.sppci_vendor || '',
        vramTotalGB: totalMB > 0 ? +(totalMB / 1024).toFixed(1) : 0,
        metalFamily: g.metal_family || '',
      };
    });
  } catch {
    gpuCache = [];
  }
  return gpuCache;
}

async function getNPUInfo() {
  if (npuCache) return npuCache;
  if (process.platform !== 'darwin') { npuCache = { available: false }; return npuCache; }

  const cpuModel = os.cpus()[0]?.model || '';
  if (!cpuModel.includes('Apple')) { npuCache = { available: false }; return npuCache; }
  const out = await _exec('/usr/sbin/sysctl', ['-n', 'machdep.cpu.brand_string']);
  npuCache = { available: true, name: out.trim() || 'Apple Neural Engine' };
  return npuCache;
}

function clearHardwareCache() {
  gpuCache = null;
  npuCache = null;
  lastCpuSample = null;
  lastCpuUsage = 0;
  hasCpuReading = false;
}

// Warm the hardware probes in the background at startup so the first
// /api/system/stats request is served from cache instead of forking processes.
function prewarm() {
  sampleCPUTimes();
  lastCpuSample = { wall: Date.now(), ...sampleCPUTimes() };
  Promise.all([getGPUInfo(), getNPUInfo()]).catch(() => {});
}

async function getStats() {
  // CPU and memory are independent probes — run them concurrently so the
  // response costs the slowest one rather than the sum of both.
  const [cpuUsage, memory, gpus, npu] = await Promise.all([
    getCPUUsage(),
    getMemoryPressure(),
    getGPUInfo(),
    getNPUInfo(),
  ]);

  let cpuPressure = 'low';
  if (cpuUsage > 90) cpuPressure = 'extreme';
  else if (cpuUsage > 80) cpuPressure = 'high';
  else if (cpuUsage > 60) cpuPressure = 'normal';

  const gpuResults = gpus.map((g) => ({ ...g, usagePercent: null, pressure: 'low' }));

  return {
    cpu: {
      ...getCPUInfo(),
      usagePercent: cpuUsage,
      pressure: cpuPressure,
      loadAverage: os.loadavg(),
    },
    memory,
    gpu: gpuResults,
    npu: { ...npu, usagePercent: null, pressure: 'low' },
  };
}

module.exports = { getStats, clearHardwareCache, prewarm };
