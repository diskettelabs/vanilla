/* Subtle UI sound effects generated with the Web Audio API (no audio assets). */
const Sounds = (() => {
  let ctx = null;
  let master = null;
  let enabled = true;
  let keyEnabled = false;
  let keyStyle = "mechanical";
  let volume = 0.9;
  let lastKeyTime = 0;

  function ensureContext() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      return ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volume;
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

  // Short filtered-noise burst (used by the typewriter style)
  function burst({ duration = 0.02, volume = 0.05, lowpass = 4800 }) {
    const ac = ensureContext();
    if (!ac) return;
    const t0 = ac.currentTime;
    const len = Math.max(1, Math.floor(ac.sampleRate * duration));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(volume, t0 + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    const f = ac.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = lowpass;
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + duration + 0.02);
  }

  const TYPING_STYLES = {
    mechanical: {
      key() {
        tone({
          freq: 520 + Math.round(Math.random() * 180),
          duration: 0.03,
          type: "triangle",
          volume: 0.05,
        });
        tone({
          freq: 1500 + Math.round(Math.random() * 400),
          duration: 0.014,
          type: "square",
          volume: 0.013,
        });
      },
      space() {
        tone({ freq: 300, freqEnd: 250, duration: 0.035, type: "triangle", volume: 0.04 });
        tone({
          freq: 1300 + Math.round(Math.random() * 300),
          duration: 0.011,
          type: "square",
          volume: 0.009,
        });
      },
      enter() {
        tone({ freq: 250, freqEnd: 190, duration: 0.07, type: "sine", volume: 0.055 });
      },
    },
    membrane: {
      key() {
        tone({
          freq: 430 + Math.round(Math.random() * 90),
          freqEnd: 330,
          duration: 0.045,
          type: "sine",
          volume: 0.045,
        });
      },
      space() {
        tone({ freq: 270, freqEnd: 225, duration: 0.05, type: "sine", volume: 0.035 });
      },
      enter() {
        tone({ freq: 225, freqEnd: 175, duration: 0.09, type: "sine", volume: 0.05 });
      },
    },
    typewriter: {
      key() {
        burst({ duration: 0.016, volume: 0.05, lowpass: 4800 });
        tone({
          freq: 700 + Math.round(Math.random() * 120),
          freqEnd: 480,
          duration: 0.02,
          type: "triangle",
          volume: 0.03,
        });
      },
      space() {
        burst({ duration: 0.02, volume: 0.035, lowpass: 3200 });
        tone({ freq: 260, freqEnd: 210, duration: 0.035, type: "triangle", volume: 0.028 });
      },
      enter() {
        burst({ duration: 0.06, volume: 0.045, lowpass: 2200 });
        tone({ freq: 185, freqEnd: 140, duration: 0.1, type: "sine", volume: 0.06 });
      },
    },
    cherry: {
      key() {
        tone({
          freq: 880 + Math.round(Math.random() * 120),
          duration: 0.02,
          type: "triangle",
          volume: 0.035,
        });
      },
      space() {
        tone({ freq: 620, duration: 0.022, type: "triangle", volume: 0.028 });
      },
      enter() {
        tone({ freq: 440, freqEnd: 330, duration: 0.06, type: "triangle", volume: 0.04 });
      },
    },
  };

  function typingStyle() {
    return TYPING_STYLES[keyStyle] || TYPING_STYLES.mechanical;
  }

  function playKey() {
    if (!enabled || !keyEnabled) return;
    const ac = ensureContext();
    if (!ac) return;
    if (ac.currentTime - lastKeyTime < 0.028) return;
    lastKeyTime = ac.currentTime;
    typingStyle().key();
  }

  function playSpace() {
    if (!enabled || !keyEnabled) return;
    const ac = ensureContext();
    if (!ac) return;
    if (ac.currentTime - lastKeyTime < 0.04) return;
    lastKeyTime = ac.currentTime;
    typingStyle().space();
  }

  function playEnter() {
    if (!enabled || !keyEnabled) return;
    const ac = ensureContext();
    if (!ac) return;
    if (ac.currentTime - lastKeyTime < 0.06) return;
    lastKeyTime = ac.currentTime;
    typingStyle().enter();
  }

  return {
    setEnabled(value) {
      enabled = Boolean(value);
    },
    isEnabled() {
      return enabled;
    },
    setKeyEnabled(value) {
      keyEnabled = Boolean(value);
    },
    isKeyEnabled() {
      return keyEnabled;
    },
    setVolume(value) {
      volume = Math.min(1, Math.max(0, Number(value) || 0));
      if (ctx && master) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.03);
    },
    getVolume() {
      return volume;
    },

    // Mode switching (chat <-> agent)
    modeSwitch(mode) {
      if (mode === "agent") {
        // Quiet boot-up arpeggio: G4 -> C5 -> E5 -> G5, terminal "slotting in" feel
        chord([
          { freq: 392, duration: 0.05, type: "sine", volume: 0.055 },
          { freq: 523.25, time: 0.05, duration: 0.06, type: "sine", volume: 0.065 },
          { freq: 659.25, time: 0.1, duration: 0.07, type: "sine", volume: 0.07 },
          { freq: 783.99, time: 0.15, duration: 0.09, type: "sine", volume: 0.07 },
        ]);
        tone({ freq: 131, duration: 0.14, type: "sine", volume: 0.04 });
      } else {
        // Warm settle: E6 -> E5, back to home
        chord([
          { freq: 659.25, duration: 0.07, type: "sine", volume: 0.065 },
          { freq: 523.25, time: 0.05, duration: 0.07, type: "sine", volume: 0.07 },
          { freq: 392, time: 0.1, duration: 0.12, type: "sine", volume: 0.075 },
        ]);
      }
    },
    tabSwitch() {
      chord([
        { freq: 466, duration: 0.045, type: "triangle", volume: 0.05 },
        { freq: 698, time: 0.035, duration: 0.06, type: "triangle", volume: 0.05 },
      ]);
    },

    // Typing ticks (independent toggle; throttled, always fires per character)
    key(preview = false) {
      playKey();
    },
    keySpace() {
      playSpace();
    },
    keyReturn() {
      playEnter();
    },
    setKeyStyle(value) {
      if (TYPING_STYLES[value]) keyStyle = value;
    },
    getKeyStyle() {
      return keyStyle;
    },
    previewTyping() {
      if (!enabled || !keyEnabled) return;
      const ac = ensureContext();
      if (!ac) return;
      lastKeyTime = 0;
      const seq = [playKey, playSpace, playKey, playEnter];
      setTimeout(() => {
        seq.forEach((fn, i) => setTimeout(fn, i * 95));
      }, 0);
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
    sparkle() {
      chord([
        { freq: 880, duration: 0.08, type: "sine", volume: 0.09 },
        { freq: 1174, time: 0.07, duration: 0.08, type: "sine", volume: 0.09 },
        { freq: 1568, time: 0.14, duration: 0.12, type: "sine", volume: 0.09 },
      ]);
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
