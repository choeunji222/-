// Web Audio API based ambient sound generator (pure synthesis - zero external audio dependencies)

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private currentMode: 'rain' | 'fire' | 'focus' | 'bell' | null = null;
  private nodes: (AudioNode | number)[] = [];
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.4;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public stop() {
    if (this.ctx) {
      // Disconnect and stop all active nodes
      this.nodes.forEach((item) => {
        if (typeof item === 'number') {
          clearInterval(item);
        } else {
          try {
            (item as any).stop?.();
            item.disconnect();
          } catch (e) {
            // Ignore disconnect errors
          }
        }
      });
      this.nodes = [];
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
    }
    this.currentMode = null;
    this.isPlaying = false;
  }

  public play(mode: 'rain' | 'fire' | 'focus' | 'bell') {
    this.initCtx();
    if (!this.ctx) return;

    if (this.isPlaying && this.currentMode === mode) {
      this.stop();
      return;
    }

    this.stop();
    this.currentMode = mode;
    this.isPlaying = true;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    if (mode === 'rain') {
      this.startRainSound();
    } else if (mode === 'fire') {
      this.startFireSound();
    } else if (mode === 'focus') {
      this.startFocusWhiteNoise();
    } else if (mode === 'bell') {
      this.startSingingBowl();
    }
  }

  private startRainSound() {
    if (!this.ctx || !this.gainNode) return;
    // Pink noise buffer with low-pass filter to simulate gentle rain
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    whiteNoise.start();
    this.nodes.push(whiteNoise, filter);
  }

  private startFocusWhiteNoise() {
    if (!this.ctx || !this.gainNode) return;
    // Gentle study room background ambience (brownian noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 1.5;
    }

    const brownNoise = this.ctx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, this.ctx.currentTime);

    brownNoise.connect(filter);
    filter.connect(this.gainNode);
    brownNoise.start();
    this.nodes.push(brownNoise, filter);
  }

  private startFireSound() {
    if (!this.ctx || !this.gainNode) return;
    // Low rumble with random crackles
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, this.ctx.currentTime);

    osc.connect(filter);
    filter.connect(this.gainNode);
    osc.start();
    this.nodes.push(osc, filter);

    // Random crackle pulses
    const interval = window.setInterval(() => {
      if (!this.ctx || !this.gainNode || !this.isPlaying) return;
      if (Math.random() > 0.45) return;
      const crackleOsc = this.ctx.createOscillator();
      const crackleGain = this.ctx.createGain();
      crackleOsc.type = 'triangle';
      crackleOsc.frequency.setValueAtTime(800 + Math.random() * 1200, this.ctx.currentTime);
      crackleGain.gain.setValueAtTime(0.04 * this.volume, this.ctx.currentTime);
      crackleGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.06);

      crackleOsc.connect(crackleGain);
      crackleGain.connect(this.gainNode);
      crackleOsc.start();
      crackleOsc.stop(this.ctx.currentTime + 0.06);
    }, 120);

    this.nodes.push(interval);
  }

  private startSingingBowl() {
    if (!this.ctx || !this.gainNode) return;
    // Resonant calming singing bowl sine waves (432Hz healing resonance)
    const baseFreq = 216; // A3 harmonic
    const freqs = [baseFreq, baseFreq * 2, baseFreq * 2.75, baseFreq * 3.5];

    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.gainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);

      const oscGain = 0.15 / (idx + 1);
      gain.gain.setValueAtTime(oscGain, this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.gainNode);
      osc.start();
      this.nodes.push(osc, gain);
    });
  }

  public getStatus() {
    return {
      isPlaying: this.isPlaying,
      currentMode: this.currentMode,
      volume: this.volume,
    };
  }

  // Audio cues for Pomodoro timer start, complete, and gentle cues
  public playChime(type: 'start' | 'complete' | 'tick') {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (type === 'start') {
      // Gentle dual bell chime (ascending 440Hz -> 659Hz)
      const freqs = [440, 659.25];
      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.18);

        gain.gain.setValueAtTime(0, now + idx * 0.18);
        gain.gain.linearRampToValueAtTime(0.2 * this.volume, now + idx * 0.18 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 1.2);
      });
    } else if (type === 'complete') {
      // Warm resonant Tibetan singing bowl completion chime (528Hz Solfeggio Love/Healing frequency)
      const harmonics = [528, 1056, 1584, 2112];
      harmonics.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        const amp = (0.25 / (idx + 1)) * this.volume;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(amp, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.00005, now + 3.0);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 3.0);
      });
    } else if (type === 'tick') {
      // Soft woodblock tick
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1100, now);
      gain.gain.setValueAtTime(0.02 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  }
}

export const ambientAudio = new AmbientAudioEngine();
