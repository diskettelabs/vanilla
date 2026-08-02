/* Subtle UI sound effects generated with the Web Audio API (no audio assets). */
const Sounds = (() => {
  let ctx = null;
  let master = null;
  let enabled = true;

  function ensureContext() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      return ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    return ctx;
  }

  function tone({ freq = 440, freqEnd = null, time = 0, duration = 0.12, type = "sine", volume = 0.06 }) {
    if (!enabled) return;
    const ac = ensureContext();
    if (!ac) return;
    const t0 = ac.currentTime + time;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  function chord(notes) {
    notes.forEach((n) => tone(n));
  }

  return {
    setEnabled(value) {
      enabled = Boolean(value);
    },
    isEnabled() {
      return enabled;
    },

    // Tiny interaction ticks
    click() {
      tone({ freq: 800, duration: 0.04, type: "sine", volume: 0.06 });
    },
    toggle() {
      tone({ freq: 700, freqEnd: 900, duration: 0.06, type: "sine", volume: 0.07 });
    },
    copy() {
      tone({ freq: 950, duration: 0.045, type: "triangle", volume: 0.06 });
    },

    // Modal / navigation
    open() {
      tone({ freq: 440, freqEnd: 660, duration: 0.11, type: "sine", volume: 0.09 });
    },
    close() {
      tone({ freq: 520, freqEnd: 330, duration: 0.11, type: "sine", volume: 0.08 });
    },
    newChat() {
      tone({ freq: 620, freqEnd: 820, duration: 0.14, type: "sine", volume: 0.1 });
    },
    switchChat() {
      chord([
        { freq: 540, duration: 0.07, type: "triangle", volume: 0.08 },
        { freq: 720, time: 0.06, duration: 0.09, type: "triangle", volume: 0.08 },
      ]);
    },
    pin() {
      tone({ freq: 760, duration: 0.05, type: "triangle", volume: 0.09 });
    },
    rename() {
      tone({ freq: 480, freqEnd: 640, duration: 0.08, type: "triangle", volume: 0.08 });
    },

    // Status feedback
    send() {
      tone({ freq: 520, freqEnd: 780, duration: 0.1, type: "sine", volume: 0.12 });
    },
    receive() {
      chord([
        { freq: 660, duration: 0.12, type: "sine", volume: 0.12 },
        { freq: 880, time: 0.1, duration: 0.15, type: "sine", volume: 0.12 },
      ]);
    },
    success() {
      chord([
        { freq: 660, duration: 0.1, type: "sine", volume: 0.1 },
        { freq: 990, time: 0.09, duration: 0.13, type: "sine", volume: 0.1 },
      ]);
    },
    warning() {
      tone({ freq: 520, freqEnd: 470, duration: 0.18, type: "triangle", volume: 0.11 });
    },
    error() {
      tone({ freq: 190, freqEnd: 140, duration: 0.2, type: "triangle", volume: 0.14 });
    },
    delete() {
      tone({ freq: 400, freqEnd: 240, duration: 0.14, type: "triangle", volume: 0.08 });
    },
    upload() {
      chord([
        { freq: 520, duration: 0.09, type: "sine", volume: 0.09 },
        { freq: 780, time: 0.08, duration: 0.12, type: "sine", volume: 0.09 },
      ]);
    },
    attachmentRemove() {
      tone({ freq: 560, freqEnd: 400, duration: 0.07, type: "triangle", volume: 0.08 });
    },
    export() {
      chord([
        { freq: 520, duration: 0.08, type: "sine", volume: 0.08 },
        { freq: 780, time: 0.06, duration: 0.08, type: "sine", volume: 0.08 },
        { freq: 1040, time: 0.12, duration: 0.1, type: "sine", volume: 0.08 },
      ]);
    },
    stop() {
      tone({ freq: 280, freqEnd: 180, duration: 0.09, type: "triangle", volume: 0.1 });
    },
    clear() {
      tone({ freq: 420, freqEnd: 300, duration: 0.08, type: "triangle", volume: 0.08 });
    },

    // Dictation
    recordStart() {
      tone({ freq: 880, duration: 0.08, type: "sine", volume: 0.09 });
    },
    recordStop() {
      tone({ freq: 660, freqEnd: 440, duration: 0.12, type: "sine", volume: 0.09 });
    },
  };
})();
