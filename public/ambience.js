/* Generative background music via Web Audio (no audio assets).
 * A small engine with 4 selectable "tracks" — warm lo-fi grooves that
 * evolve forever: Vanilla Haze, Golden Hour, Midnight Lo-Fi, Rainy Day. */
const Ambience = (() => {
  let ctx = null;
  let master = null;
  let padBus = null;
  let pluckBus = null;
  let bassBus = null;
  let percBus = null;
  let filter = null;
  let reverb = null;
  let scheduler = null;
  let noiseBuffer = null;
  let enabled = false;
  let ducked = false;

  const TRACKS = {
    vanilla: {
      bpm: 72,
      chordBeats: 8,
      chords: [
        ["C4", "E4", "G4", "B4"], // Cmaj7
        ["A3", "C4", "E4", "G4"], // Am7
        ["F3", "A3", "C4", "E4"], // Fmaj7
        ["G3", "B3", "D4", "E4"], // G6
      ],
      pad: true,
      bass: true,
      melody: "arp",
      percussion: "brush",
      sparkle: 0.15,
    },
    golden: {
      bpm: 66,
      chordBeats: 8,
      chords: [
        ["C4", "E4", "G4", "B4"], // Cmaj7
        ["G3", "B3", "D4", "E4"], // G6
        ["A3", "C4", "E4", "G4"], // Am7
        ["F3", "A3", "C4", "E4"], // Fmaj7
      ],
      pad: true,
      bass: true,
      melody: "sustained",
      percussion: "shaker",
      sparkle: 0,
    },
    midnight: {
      bpm: 78,
      chordBeats: 8,
      chords: [
        ["A3", "C4", "E4", "G4"], // Am7
        ["F3", "A3", "C4", "E4"], // Fmaj7
        ["C4", "E4", "G4", "B4"], // Cmaj7
        ["G3", "B3", "D4", "E4"], // G6
      ],
      pad: true,
      bass: true,
      melody: "arp",
      percussion: "kickhat",
      sparkle: 0.1,
    },
    rainy: {
      bpm: 58,
      chordBeats: 12,
      chords: [
        ["C4", "E4", "G4", "B4"], // Cmaj7
        ["A3", "C4", "E4", "G4"], // Am7
        ["F3", "A3", "C4", "E4"], // Fmaj7
        ["D3", "F3", "A3", "C4"], // Dm7
      ],
      pad: true,
      bass: false,
      melody: "piano",
      percussion: "none",
      sparkle: 0,
    },
  };

  const SCALE = ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5"];

  const SEMI = {
    C: 0, Cs: 1, Db: 1, D: 2, Ds: 3, Eb: 3, E: 4, F: 5,
    Fs: 6, Gb: 6, G: 7, Gs: 8, Ab: 8, A: 9, As: 10, Bb: 10, B: 11,
  };

  let track = TRACKS.vanilla;

  function nf(name) {
    const m = name.match(/^([A-G][sb]?)(\d)$/);
    if (!m) return 440;
    const semitone = SEMI[m[1]];
    const octave = parseInt(m[2], 10);
    return 440 * Math.pow(2, octave - 4 + (semitone - 9) / 12);
  }

  function chordDur() {
    return track.chordBeats * (60 / track.bpm);
  }

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 0;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -22;
    limiter.ratio.value = 4;
    limiter.attack.value = 0.01;
    limiter.release.value = 0.6;
    master.connect(limiter);
    limiter.connect(ctx.destination);

    filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    filter.Q.value = 0.3;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 450;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const rate = ctx.sampleRate;
    const len = Math.floor(rate * 3);
    const buffer = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
      }
    }
    reverb = ctx.createConvolver();
    reverb.buffer = buffer;

    padBus = ctx.createGain();
    padBus.connect(filter);
    const padWet = ctx.createGain();
    padWet.gain.value = 0.25;
    const padDry = ctx.createGain();
    padDry.gain.value = 0.3;
    filter.connect(padWet);
    filter.connect(padDry);
    padWet.connect(reverb);
    padDry.connect(master);
    reverb.connect(master);

    pluckBus = ctx.createGain();
    const pluckWet = ctx.createGain();
    pluckWet.gain.value = 0.5;
    const pluckDry = ctx.createGain();
    pluckDry.gain.value = 0.3;
    pluckBus.connect(pluckWet);
    pluckBus.connect(pluckDry);
    pluckWet.connect(reverb);
    pluckDry.connect(master);

    bassBus = ctx.createGain();
    const bassWet = ctx.createGain();
    bassWet.gain.value = 0.2;
    const bassDry = ctx.createGain();
    bassDry.gain.value = 0.9;
    bassBus.connect(bassWet);
    bassBus.connect(bassDry);
    bassWet.connect(reverb);
    bassDry.connect(master);

    percBus = ctx.createGain();
    percBus.connect(master);

    const nlen = Math.floor(rate * 0.2);
    noiseBuffer = ctx.createBuffer(1, nlen, rate);
    const ndata = noiseBuffer.getChannelData(0);
    for (let i = 0; i < nlen; i++) {
      ndata[i] = Math.random() * 2 - 1;
    }

    const unlock = () => {
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
  }

  function padEnv(g, t0, peak, hold) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 3.5);
    g.gain.setValueAtTime(peak, t0 + hold);
    g.gain.linearRampToValueAtTime(0.0001, t0 + hold + 4);
  }

  function playPad(chord, when) {
    const voice = (freq, detune, volume, offset) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      if (detune) osc.detune.value = detune;
      const g = ctx.createGain();
      const t0 = when + offset;
      padEnv(g, t0, volume, chordDur());
      osc.connect(g);
      g.connect(padBus);
      osc.start(t0);
      osc.stop(t0 + chordDur() + 4.2);
    };
    for (const note of chord) {
      const f = nf(note);
      voice(f, 0, 0.013, 0);
      voice(f, 6, 0.009, 0);
      voice(f, -6, 0.007, 0.6);
    }
    if (Math.random() < track.sparkle) {
      voice(nf(chord[chord.length - 1]) * 2, 0, 0.011, chordDur() / 2);
    }
  }

  function playBass(freq, when) {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    const t0 = when;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.07, t0 + 0.6);
    g.gain.setValueAtTime(0.07, t0 + chordDur() - 0.4);
    g.gain.linearRampToValueAtTime(0.0001, t0 + chordDur() + 2);
    osc.connect(g);
    g.connect(bassBus);
    osc.start(t0);
    osc.stop(t0 + chordDur() + 2.2);
  }

  function playNote(freq, when, opts = {}) {
    const {
      type = "triangle",
      volume = 0.055,
      decay = 1.1,
      lowpass = 0,
    } = opts;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    const t0 = when;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    let out = g;
    if (lowpass) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = lowpass;
      g.connect(lp);
      out = lp;
    }
    osc.connect(g);
    out.connect(pluckBus);
    osc.start(t0);
    osc.stop(t0 + decay + 0.2);
  }

  function playKick(when) {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(130, when);
    osc.frequency.exponentialRampToValueAtTime(48, when + 0.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.09, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
    osc.connect(g);
    g.connect(percBus);
    osc.start(when);
    osc.stop(when + 0.24);
  }

  function noiseHit(when, opts = {}) {
    const { volume = 0.03, freq = 5500, Q = 0.7, decay = 0.12, type = "bandpass" } = opts;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = type;
    bp.frequency.value = freq;
    bp.Q.value = Q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(volume, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + decay);
    src.connect(bp);
    bp.connect(g);
    g.connect(percBus);
    src.start(when);
    src.stop(when + decay + 0.05);
  }

  function playPercussion(pos, t) {
    switch (track.percussion) {
      case "brush":
        noiseHit(t, { volume: pos === 0 ? 0.032 : 0.02 });
        break;
      case "shaker":
        noiseHit(t, { volume: pos === 0 || pos === 4 ? 0.028 : 0.02, freq: 7000 });
        break;
      case "kickhat":
        if (pos === 0 || pos === 4) playKick(t);
        noiseHit(t, { volume: 0.014, freq: 8500, decay: 0.06 });
        break;
      default:
        break;
    }
  }

  function playMelody(beat, chord, t, pos) {
    if (track.melody === "arp") {
      if (Math.random() < 0.82) {
        const seq = [0, 1, 2, 3, 4, 3, 2, 1];
        const idx = seq[pos];
        let f = idx === 4 ? nf(chord[3]) * 2 : nf(chord[idx]);
        if (Math.random() < track.sparkle) f *= 2;
        playNote(f, t + 0.01);
        if (Math.random() < 0.25 && pos < 7) {
          playNote(nf(SCALE[Math.floor(Math.random() * SCALE.length)]), t + (60 / track.bpm) * 0.5, { volume: 0.03 });
        }
      }
    } else if (track.melody === "sustained") {
      const beatDur = 60 / track.bpm;
      if (pos === 0) {
        playNote(nf(chord[3]) * 2, t + 0.01, { type: "sine", volume: 0.05, decay: chordDur() * 0.8 });
      } else if (pos === 4) {
        playNote(nf(chord[1]) * 2, t + 0.01, { type: "sine", volume: 0.035, decay: beatDur * 3 });
      }
    }
    void beat;
  }

  let startTime = 0;
  let nextBeat = 0;
  let nextPianoTime = 0;

  function chordAt(beat) {
    return track.chords[Math.floor(beat / track.chordBeats) % track.chords.length];
  }

  function scheduleChunk() {
    const now = ctx.currentTime;
    const beatDur = 60 / track.bpm;
    while (startTime + nextBeat * beatDur < now + 8) {
      const beat = nextBeat;
      const t = startTime + beat * beatDur;
      const chord = chordAt(beat);
      const pos = beat % track.chordBeats;

      if (pos === 0) {
        if (track.pad) playPad(chord, t);
        if (track.bass) playBass(nf(chord[0]) / 2, t);
      }

      playPercussion(pos, t);
      playMelody(beat, chord, t, pos);
      nextBeat++;
    }

    if (track.melody === "piano") {
      while (nextPianoTime < now + 8) {
        const f = nf(SCALE[Math.floor(Math.random() * SCALE.length)]);
        playNote(f, nextPianoTime, { type: "triangle", volume: 0.05, decay: 1.6, lowpass: 2200 });
        if (Math.random() < 0.3) {
          playNote(f / 2, nextPianoTime + 0.25, { type: "sine", volume: 0.03, decay: 2.4 });
        }
        nextPianoTime += 1.8 + Math.random() * 2.4;
      }
    }
  }

  function setMaster() {
    if (!ctx) return;
    const target = enabled ? (ducked ? 0.12 : 0.6) : 0;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(target, ctx.currentTime, 0.6);
  }

  return {
    setEnabled(value) {
      enabled = Boolean(value);
      if (!ctx) build();
      if (!ctx) return;
      if (enabled) {
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        startTime = ctx.currentTime + 1;
        nextBeat = 0;
        nextPianoTime = startTime + 2;
        if (scheduler) clearInterval(scheduler);
        scheduler = setInterval(scheduleChunk, 1000);
        setMaster();
      } else {
        if (scheduler) clearInterval(scheduler);
        scheduler = null;
        setMaster();
      }
    },
    setTrack(name) {
      if (TRACKS[name]) track = TRACKS[name];
      if (enabled && ctx) {
        startTime = ctx.currentTime + 0.5;
        nextBeat = 0;
        nextPianoTime = startTime + 2;
      }
    },
    setDucked(value) {
      ducked = Boolean(value);
      setMaster();
    },
    isEnabled() {
      return enabled;
    },
  };
})();
