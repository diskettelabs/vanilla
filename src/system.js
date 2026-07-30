const os = require('os');
const { execSync } = require('node:child_process');

function _exec(cmd) {
  try {
    return execSync(cmd, { timeout: 2000, encoding: 'utf-8' });
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

function calcCPUUsage() {
  const s1 = sampleCPUTimes();
  const samples = [];
  for (let i = 0; i < 3; i++) {
    const start = process.hrtime.bigint();
    const s = sampleCPUTimes();
    const elapsed = Number(process.hrtime.bigint() - start) / 1e9;
    if (elapsed > 0) {
      const idleDelta = s.idle - s1.idle;
      const totalDelta = s.total - s1.total;
      if (totalDelta > 0) {
        samples.push(+((1 - idleDelta / totalDelta) * 100).toFixed(1));
      }
    }
  }
  if (!samples.length) return 0;
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}

function getCPUUsageDarwin() {
  const out = _exec('/usr/bin/top -l 1 -n 0 | /usr/bin/grep "CPU usage"');
  const m = out.match(/(\d+[.,]\d+)% user.*?(\d+[.,]\d+)% sys.*?(\d+[.,]\d+)% idle/);
  if (m) return +((100 - parseFloat(m[3].replace(',', '.'))).toFixed(1));
  return calcCPUUsage();
}

function getCPUUsageLinux() {
  const s1 = _exec("grep 'cpu ' /proc/stat");
  const idle1 = s1.match(/^\s*cpu\s+.*?\s+(\d+)\s*$/m);
  const total1 = s1.match(/^\s*cpu\s+(\d+)/);
  if (!idle1 || !total1) return calcCPUUsage();
  return calcCPUUsage();
}

function getCPUUsage() {
  if (process.platform === 'darwin') return getCPUUsageDarwin();
  if (process.platform === 'linux') return getCPUUsageLinux();
  return calcCPUUsage();
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

function getMemoryPressureDarwin() {
  const out = _exec('/usr/bin/memory_pressure');
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

function getMemoryPressure() {
  if (process.platform === 'darwin') return getMemoryPressureDarwin();
  return getMemoryInfo();
}

function getGPUInfo() {
  const platform = process.platform;
  if (platform === 'darwin') return getGPUInfoDarwin();
  return [];
}

function getGPUInfoDarwin() {
  const out = _exec('/usr/sbin/system_profiler SPDisplaysDataType -json');
  if (!out) return [];
  try {
    const data = JSON.parse(out);
    const gpus = data.SPDisplaysDataType || [];
    return gpus.map((g) => {
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
    return [];
  }
}

function getNPUInfo() {
  const platform = process.platform;
  if (platform === 'darwin') return getNPUInfoDarwin();
  return { available: false };
}

function getNPUInfoDarwin() {
  const cpuModel = os.cpus()[0]?.model || '';
  const isAppleSilicon = cpuModel.includes('Apple');
  if (!isAppleSilicon) return { available: false };
  const out = _exec('/usr/sbin/sysctl -n machdep.cpu.brand_string 2>/dev/null || echo ""');
  const name = out.trim() || 'Apple Neural Engine';
  return { available: true, name };
}

function getStats() {
  const cpuUsage = getCPUUsage();
  const memory = getMemoryPressure();

  let cpuPressure = 'low';
  if (cpuUsage > 90) cpuPressure = 'extreme';
  else if (cpuUsage > 80) cpuPressure = 'high';
  else if (cpuUsage > 60) cpuPressure = 'normal';

  const gpus = getGPUInfo();
  const gpuResults = gpus.map((g) => {
    let gp = 'low';
    return { ...g, usagePercent: null, pressure: gp };
  });

  let npuPressure = 'low';

  return {
    cpu: {
      ...getCPUInfo(),
      usagePercent: cpuUsage,
      pressure: cpuPressure,
      loadAverage: os.loadavg(),
    },
    memory,
    gpu: gpuResults,
    npu: { ...getNPUInfo(), usagePercent: null, pressure: npuPressure },
  };
}

module.exports = { getStats };
