export class GameAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.wind = null;
    this.windGain = null;
    this.lastStep = 0;
    this.lastHazard = 0;
    this.enabled = true;
  }

  ensure() {
    if (!this.enabled) return null;
    if (this.context) return this.context;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      this.enabled = false;
      return null;
    }

    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.22;
    this.master.connect(this.context.destination);
    this.createWind();
    return this.context;
  }

  unlock() {
    const context = this.ensure();
    if (context?.state === 'suspended') context.resume();
  }

  createWind() {
    const bufferSize = 2 * this.context.sampleRate;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) data[i] = Math.random() * 2 - 1;

    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 680;

    this.windGain = this.context.createGain();
    this.windGain.gain.value = 0;
    noise.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.master);
    noise.start();
    this.wind = noise;
  }

  update({ isMoving = false, hazardPressure = 0, blizzardPressure = 0, progress = 0 }) {
    const context = this.ensure();
    if (!context) return;

    const windTarget = 0.035 + progress * 0.05 + hazardPressure * 0.035 + blizzardPressure * 0.16;
    this.windGain.gain.setTargetAtTime(windTarget, context.currentTime, 0.18);

    if (isMoving && context.currentTime - this.lastStep > 0.42) {
      this.lastStep = context.currentTime;
      this.step(progress);
    }

    if (hazardPressure > 0.58 && context.currentTime - this.lastHazard > 1.6) {
      this.lastHazard = context.currentTime;
      this.hazard(hazardPressure);
    }
  }

  tone(frequency, duration, gain = 0.08, type = 'sine', when = 0) {
    const context = this.ensure();
    if (!context) return;
    const start = context.currentTime + when;
    const osc = context.createOscillator();
    const amp = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.025);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(amp);
    amp.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.04);
  }

  step(progress) {
    this.tone(88 + progress * 18, 0.09, 0.035, 'triangle');
  }

  hazard(pressure) {
    this.tone(220 + pressure * 80, 0.16, 0.06, 'sawtooth');
    this.tone(164, 0.22, 0.04, 'triangle', 0.09);
  }

  warning() {
    this.tone(96, 0.18, 0.045, 'triangle');
    this.tone(72, 0.32, 0.035, 'sine', 0.08);
  }

  camp() {
    [392, 494, 587].forEach((frequency, index) => this.tone(frequency, 0.24, 0.055, 'sine', index * 0.1));
  }

  summit() {
    [262, 330, 392, 523].forEach((frequency, index) => this.tone(frequency, 0.85, 0.05, 'sine', index * 0.18));
  }

  fail() {
    this.tone(196, 0.5, 0.055, 'triangle');
    this.tone(123, 0.75, 0.04, 'sine', 0.22);
  }
}
