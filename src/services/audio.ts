// Synthesized Web Audio API sound effects and original background music for Piggy Road
// 100% lightweight procedural audio with zero external dependencies and zero copyrighted assets

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private isSoundEnabled: boolean = true;
  private isMusicEnabled: boolean = true;
  private hasUserInteracted: boolean = false;

  // Background Music Loop state
  private isMusicPlaying: boolean = false;
  private musicIntervalId: number | null = null;
  private musicStep: number = 0;

  // Throttle state to prevent audio stacking
  private lastCarPassTime: number = 0;
  private lastWarningTime: number = 0;
  private lastWolfChaseTime: number = 0;

  constructor() {
    // Setup lazy unlock on first user gesture
    if (typeof window !== 'undefined') {
      const unlock = () => {
        if (!this.hasUserInteracted) {
          this.hasUserInteracted = true;
          this.initContext();
        }
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('click', unlock);
      };

      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
      window.addEventListener('click', unlock, { passive: true });
    }
  }

  public initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        this.ctx = new AudioContextClass();

        // Master SFX Gain Node
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.isSoundEnabled ? 1.0 : 0.0, this.ctx.currentTime);
        this.sfxGain.connect(this.ctx.destination);

        // Master Music Gain Node
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.isMusicEnabled ? 0.22 : 0.0, this.ctx.currentTime);
        this.musicGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  // SFX Setting Control
  public setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(enabled ? 1.0 : 0.0, this.ctx.currentTime);
    }
  }

  public getSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  // Backward compatibility alias for existing calls
  public setMuted(muted: boolean) {
    this.setSoundEnabled(!muted);
  }

  public getMuted(): boolean {
    return !this.isSoundEnabled;
  }

  // Music Setting Control
  public setMusicEnabled(enabled: boolean) {
    this.isMusicEnabled = enabled;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(enabled ? 0.22 : 0.0, this.ctx.currentTime);
    }
    if (!enabled) {
      this.stopMusic();
    } else if (this.hasUserInteracted) {
      this.startMusic();
    }
  }

  public getMusicEnabled(): boolean {
    return this.isMusicEnabled;
  }

  // -------------------------------------------------------------
  // 1. PIG MOVEMENT (Cute hop chirp with soft rising frequency)
  // -------------------------------------------------------------
  public playHop() {
    if (!this.isSoundEnabled) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Gentle cheerful pitch sweep: 280Hz -> 580Hz
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.075);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.085);
  }

  // -------------------------------------------------------------
  // 2. COIN COLLECTION (Sparkling dual-bell harmonic chime)
  // -------------------------------------------------------------
  public playCoin() {
    if (!this.isSoundEnabled) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const freqs = [987.77, 1318.51, 1760.0]; // B5, E6, A6 bright chord

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);

      gain.gain.setValueAtTime(0.2, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.17);
    });
  }

  // -------------------------------------------------------------
  // 3. BUTTON CLICK (Crisp wooden UI pop)
  // -------------------------------------------------------------
  public playButtonClick() {
    if (!this.isSoundEnabled) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.04);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // -------------------------------------------------------------
  // 4. SUCCESSFUL PURCHASE (Triumphant cha-ching & major arpeggio)
  // -------------------------------------------------------------
  public playPurchase() {
    if (!this.isSoundEnabled) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.065);

      gain.gain.setValueAtTime(0.22, now + idx * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.065);
      osc.stop(now + idx * 0.065 + 0.23);
    });
  }

  // -------------------------------------------------------------
  // 5. INSUFFICIENT COINS (Low error double buzz)
  // -------------------------------------------------------------
  public playInsufficientCoins() {
    if (!this.isSoundEnabled) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    [0, 0.12].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now + offset);
      osc.frequency.exponentialRampToValueAtTime(100, now + offset + 0.09);

      gain.gain.setValueAtTime(0.18, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + offset);
      osc.stop(now + offset + 0.095);
    });
  }

  // -------------------------------------------------------------
  // 6. CAR PASSING (Doppler swoosh / engine breeze)
  // -------------------------------------------------------------
  public playCarPass(pan: number = 0) {
    if (!this.isSoundEnabled) return;
    const nowMs = performance.now();
    // Throttle car swooshes to max once every 220ms
    if (nowMs - this.lastCarPassTime < 220) return;
    this.lastCarPassTime = nowMs;

    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Subtle Doppler pitch drop: 340Hz -> 180Hz
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    // Stereo Panning if supported
    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxGain);
    } else {
      osc.connect(gain);
      gain.connect(this.sfxGain);
    }

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playHonk() {
    this.playCarPass(0);
  }

  // -------------------------------------------------------------
  // 7. IDLE WARNING (Pulsing alert beep scaling with urgency)
  // -------------------------------------------------------------
  public playIdleWarning(urgencyRatio: number = 0.5) {
    if (!this.isSoundEnabled) return;
    const nowMs = performance.now();
    // Dynamic throttle based on urgency (from 600ms down to 250ms)
    const throttle = Math.max(240, 600 - urgencyRatio * 360);
    if (nowMs - this.lastWarningTime < throttle) return;
    this.lastWarningTime = nowMs;

    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = 480 + urgencyRatio * 260; // 480Hz to 740Hz
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, now + 0.08);

    const volume = 0.12 + urgencyRatio * 0.08;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.095);
  }

  public playWarningTick(pitchMultiplier: number = 1.0) {
    this.playIdleWarning((pitchMultiplier - 1.0) * 0.5);
  }

  // -------------------------------------------------------------
  // 8. WOLF APPEARING (Dramatic cartoon howl / eerie rising pitch swell)
  // -------------------------------------------------------------
  public playWolfAppear() {
    if (!this.isSoundEnabled) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Howl glide: 260Hz -> 620Hz -> 420Hz
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(620, now + 0.35);
    osc.frequency.linearRampToValueAtTime(420, now + 0.7);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.73);
  }

  public playWolfAlert() {
    this.playWolfAppear();
  }

  // -------------------------------------------------------------
  // 9. WOLF CHASE (Tense rhythmic rapid footstep / panting tempo)
  // -------------------------------------------------------------
  public playWolfChase() {
    if (!this.isSoundEnabled) return;
    const nowMs = performance.now();
    if (nowMs - this.lastWolfChaseTime < 180) return;
    this.lastWolfChaseTime = nowMs;

    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.085);
  }

  // -------------------------------------------------------------
  // 10. GAME OVER (Crash / Wolf Catch with sad descending minor coda)
  // -------------------------------------------------------------
  public playGameOver(reason: 'CAR' | 'WOLF' = 'CAR') {
    if (!this.isSoundEnabled) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;

    if (reason === 'CAR') {
      // 1. Crash punch
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Wolf swoop grab
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.42);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.45);
    }

    // 2. Sad descending minor notes (Eb4 -> D4 -> C4 -> G3)
    const sadNotes = [311.13, 293.66, 261.63, 196.0];
    sadNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const noteStart = now + 0.3 + idx * 0.14;
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.2, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteStart);
      osc.stop(noteStart + 0.23);
    });
  }

  public playCrash() {
    this.playGameOver('CAR');
  }

  public playWolfCatch() {
    this.playGameOver('WOLF');
  }

  // -------------------------------------------------------------
  // 11. NEW HIGH SCORE (Triumphant brass fanfare)
  // -------------------------------------------------------------
  public playHighScore() {
    if (!this.isSoundEnabled) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const notes = [
      { f: 523.25, d: 0.1 }, // C5
      { f: 659.25, d: 0.1 }, // E5
      { f: 783.99, d: 0.1 }, // G5
      { f: 1046.5, d: 0.35 }, // C6 (long finish)
    ];

    let t = now;
    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.26, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t);
      osc.stop(t + note.d + 0.02);

      t += note.d * 0.85;
    });
  }

  // -------------------------------------------------------------
  // ORIGINAL PROCEDURAL BACKGROUND MUSIC LOOP (Web Audio API)
  // -------------------------------------------------------------
  public startMusic() {
    this.stopMusic();
    if (!this.isMusicEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    this.isMusicPlaying = true;
    this.musicStep = 0;

    // Cheerful, pentatonic arcade melody pattern (C major pentatonic)
    const melody = [
      523.25, 0, 659.25, 783.99, 0, 659.25, 523.25, 0,
      783.99, 880.0, 783.99, 659.25, 523.25, 0, 392.0, 0,
      523.25, 659.25, 783.99, 0, 880.0, 1046.5, 880.0, 783.99,
      659.25, 0, 523.25, 392.0, 523.25, 0, 0, 0,
    ];

    const bass = [
      130.81, 0, 130.81, 0, 164.81, 0, 164.81, 0,
      196.0, 0, 196.0, 0, 130.81, 0, 196.0, 0,
      174.61, 0, 174.61, 0, 196.0, 0, 196.0, 0,
      130.81, 0, 196.0, 0, 130.81, 0, 0, 0,
    ];

    const stepDuration = 145; // ms per 16th note

    this.musicIntervalId = window.setInterval(() => {
      if (!this.isMusicPlaying || !this.isMusicEnabled || !this.ctx || !this.musicGain) return;

      const now = this.ctx.currentTime;
      const mFreq = melody[this.musicStep % melody.length];
      const bFreq = bass[this.musicStep % bass.length];

      // Play melody note
      if (mFreq > 0) {
        const mOsc = this.ctx.createOscillator();
        const mGain = this.ctx.createGain();

        mOsc.type = 'sine';
        mOsc.frequency.setValueAtTime(mFreq, now);

        mGain.gain.setValueAtTime(0.1, now);
        mGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        mOsc.connect(mGain);
        mGain.connect(this.musicGain);

        mOsc.start(now);
        mOsc.stop(now + 0.125);
      }

      // Play bass/percussion note
      if (bFreq > 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();

        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(bFreq, now);

        bGain.gain.setValueAtTime(0.12, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

        bOsc.connect(bGain);
        bGain.connect(this.musicGain);

        bOsc.start(now);
        bOsc.stop(now + 0.115);
      }

      this.musicStep = (this.musicStep + 1) % melody.length;
    }, stepDuration);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  public pauseMusic() {
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public resumeMusic() {
    if (this.isMusicEnabled && this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      if (!this.isMusicPlaying) {
        this.startMusic();
      }
    }
  }
}

export const sounds = new SoundEngine();
