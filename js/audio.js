(function () {
  "use strict";

  const LabAudio = {
    ctx: null,
    master: null,
    noiseBuffer: null,
    muted: false,
    ambience: null,

    init: function () {
      if (this.ctx) {
        if (this.ctx.state === "suspended") this.ctx.resume();
        return true;
      }
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.46;
      this.master.connect(this.ctx.destination);
      this.buildNoise();
      this.startAmbience();
      return true;
    },

    unlock: function () {
      if (!this.init()) return false;
      if (this.ctx.state === "suspended") this.ctx.resume();
      return true;
    },

    toggle: function () {
      this.setMuted(!this.muted);
      return this.muted;
    },

    setMuted: function (value) {
      this.muted = !!value;
      if (!this.master || !this.ctx) return this.muted;
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.46, now, 0.04);
      return this.muted;
    },

    buildNoise: function () {
      const length = Math.floor(this.ctx.sampleRate * 1.2);
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        last = last * 0.965 + white * 0.035;
        data[i] = last * 1.7 + white * 0.08;
      }
      this.noiseBuffer = buffer;
    },

    startAmbience: function () {
      if (!this.ctx || this.ambience) return;
      const ctx = this.ctx;
      const bus = ctx.createGain();
      bus.gain.value = 0.0001;
      bus.connect(this.master);

      const humA = ctx.createOscillator();
      const humB = ctx.createOscillator();
      const humGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      humA.type = "sine";
      humB.type = "sine";
      humA.frequency.value = 55;
      humB.frequency.value = 82.5;
      humGain.gain.value = 0.018;
      filter.type = "lowpass";
      filter.frequency.value = 190;
      humA.connect(humGain);
      humB.connect(humGain);
      humGain.connect(filter);
      filter.connect(bus);

      const air = ctx.createBufferSource();
      const airFilter = ctx.createBiquadFilter();
      const airGain = ctx.createGain();
      air.buffer = this.noiseBuffer;
      air.loop = true;
      airFilter.type = "bandpass";
      airFilter.frequency.value = 420;
      airFilter.Q.value = 0.55;
      airGain.gain.value = 0.03;
      air.connect(airFilter);
      airFilter.connect(airGain);
      airGain.connect(bus);

      humA.start();
      humB.start();
      air.start();
      bus.gain.setTargetAtTime(0.65, ctx.currentTime, 1.4);
      this.ambience = { bus: bus, humA: humA, humB: humB, air: air };
    },

    now: function (delay) {
      return this.ctx.currentTime + (delay || 0);
    },

    tone: function (frequency, duration, type, level, slideTo, delay) {
      if (!this.ctx || this.muted) return;
      const ctx = this.ctx;
      const start = this.now(delay);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(Math.max(30, frequency), start);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), start + duration * 0.92);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level || 0.12), start + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(start);
      osc.stop(start + duration + 0.03);
    },

    noise: function (duration, level, frequency, delay) {
      if (!this.ctx || this.muted) return;
      const ctx = this.ctx;
      const start = this.now(delay);
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      source.buffer = this.noiseBuffer;
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(frequency || 1200, start);
      filter.Q.value = 0.8;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level || 0.1), start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start(start);
      source.stop(start + duration + 0.02);
    },

    click: function () {
      this.tone(560, 0.055, "sine", 0.08, 490);
    },

    hover: function () {
      this.tone(940, 0.025, "sine", 0.018);
    },

    pickup: function () {
      this.noise(0.09, 0.055, 1800);
      this.tone(480, 0.1, "triangle", 0.09, 690);
      this.tone(760, 0.18, "sine", 0.08, 980, 0.08);
    },

    cable: function () {
      this.noise(0.2, 0.07, 900);
      this.tone(180, 0.14, "triangle", 0.06, 120);
    },

    connect: function () {
      this.tone(840, 0.08, "triangle", 0.09, 640);
      this.tone(1260, 0.16, "sine", 0.07, 1480, 0.06);
    },

    power: function () {
      this.tone(67, 0.5, "sine", 0.22, 41);
      this.tone(150, 0.8, "sawtooth", 0.035, 580, 0.12);
      this.noise(0.44, 0.08, 240, 0.05);
      this.tone(1240, 0.09, "square", 0.055, 1240, 0.21);
    },

    bios: function () {
      this.tone(1046, 0.11, "square", 0.045);
      this.tone(1568, 0.13, "square", 0.035, 1568, 0.12);
    },

    windows: function () {
      this.tone(392, 0.7, "sine", 0.05, 523);
      this.tone(587, 0.9, "sine", 0.04, 784, 0.08);
      this.noise(0.7, 0.018, 2000, 0.1);
    },

    desktop: function () {
      this.tone(659.25, 0.5, "sine", 0.09);
      this.tone(783.99, 0.55, "sine", 0.08, 783.99, 0.11);
      this.tone(1046.5, 0.75, "sine", 0.085, 1046.5, 0.22);
      this.tone(1318.5, 0.9, "sine", 0.05, 1318.5, 0.34);
    },

    success: function () {
      this.tone(523.25, 0.15, "triangle", 0.1);
      this.tone(659.25, 0.17, "triangle", 0.09, 659.25, 0.09);
      this.tone(783.99, 0.28, "triangle", 0.1, 1046.5, 0.18);
    },

    error: function () {
      this.tone(196, 0.16, "sawtooth", 0.075, 164);
      this.tone(147, 0.2, "sawtooth", 0.055, 123, 0.12);
    },

    warning: function () {
      this.tone(392, 0.1, "triangle", 0.07, 349);
      this.tone(330, 0.14, "triangle", 0.055, 294, 0.1);
    },

    crimp: function () {
      this.noise(0.08, 0.12, 1900);
      this.tone(220, 0.11, "square", 0.05, 110);
      this.noise(0.07, 0.09, 2400, 0.14);
    },

    link: function () {
      this.tone(700, 0.06, "square", 0.05);
      this.tone(980, 0.11, "square", 0.045, 980, 0.08);
      this.noise(0.16, 0.035, 1400, 0.02);
    },

    ping: function () {
      this.tone(1250, 0.08, "sine", 0.075);
      this.tone(1560, 0.12, "sine", 0.05, 1560, 0.06);
    },

    levelUp: function () {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      for (let i = 0; i < notes.length; i++) {
        this.tone(notes[i], 0.28, "triangle", 0.09, notes[i], i * 0.085);
      }
      this.tone(1568, 0.65, "sine", 0.055, 1568, 0.34);
    }
  };

  window.LabAudio = LabAudio;
})();
