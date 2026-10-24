// Zero-dependency sound effects synthesizer using Web Audio API

class SoundSynthesizer {
  constructor() {
    this.audioCtx = null;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  playTone(freq, type = 'sine', startTime = 0, duration = 0.2, gainValue = 0.2) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(gainValue, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    } catch (e) {
      console.warn('Audio playback not allowed or failed:', e);
    }
  }

  playKotFired() {
    // Attention-demanding dual tone for kitchen staff
    this.playTone(587.33, 'triangle', 0, 0.25, 0.25); // D5
    this.playTone(880.00, 'sine', 0.18, 0.4, 0.25);    // A5
  }

  playKotReady() {
    // Upbeat major triad for waiter pickup
    this.playTone(523.25, 'sine', 0, 0.2, 0.22);      // C5
    this.playTone(659.25, 'sine', 0.12, 0.2, 0.22);     // E5
    this.playTone(783.99, 'triangle', 0.24, 0.45, 0.25);// G5
  }

  playWaiterAssigned() {
    // Mellow pleasant chime for table assignment
    this.playTone(440.00, 'sine', 0, 0.22, 0.2);       // A4
    this.playTone(659.25, 'triangle', 0.15, 0.35, 0.22);// E5
  }

  play(type) {
    switch (type) {
      case 'KOT_FIRED':
        this.playKotFired();
        break;
      case 'KOT_READY':
        this.playKotReady();
        break;
      case 'WAITER_ASSIGNED':
        this.playWaiterAssigned();
        break;
      default:
        this.playWaiterAssigned();
        break;
    }
  }
}

export const soundEffects = new SoundSynthesizer();
