/**
 * Sound & Haptics Service for MasteringLocal.Pro
 * 
 * Provides tactile haptic pulses and subtle synthesized studio console UI audio feedback
 * for mobile & desktop precision mastering controls.
 * 
 * NOTE: All UI sounds are synthesized on an isolated UI AudioContext and are NEVER
 * connected to or mixed into the mastering DSP processing chain or export audio buffers.
 */

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'
  | 'tick'
  | 'snap'
  | 'double';

class SoundHapticsService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private hapticsEnabled: boolean = true;
  private masteringCuesEnabled: boolean = true;
  private lastHapticTime: number = 0;
  private lastSoundTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedSound = localStorage.getItem('mastering_ui_sound_enabled');
      const savedHaptics = localStorage.getItem('mastering_ui_haptics_enabled');
      const savedCues = localStorage.getItem('mastering_ui_cues_enabled');
      if (savedSound !== null) this.soundEnabled = savedSound === 'true';
      if (savedHaptics !== null) this.hapticsEnabled = savedHaptics === 'true';
      if (savedCues !== null) this.masteringCuesEnabled = savedCues === 'true';
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mastering_ui_sound_enabled', String(enabled));
    }
  }

  public isHapticsEnabled(): boolean {
    return this.hapticsEnabled;
  }

  public setHapticsEnabled(enabled: boolean): void {
    this.hapticsEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mastering_ui_haptics_enabled', String(enabled));
    }
  }

  public isMasteringCuesEnabled(): boolean {
    return this.masteringCuesEnabled;
  }

  public setMasteringCuesEnabled(enabled: boolean): void {
    this.masteringCuesEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mastering_ui_cues_enabled', String(enabled));
    }
  }

  /**
   * Centralized Haptic Feedback Utility
   */
  public hapticFeedback(type: HapticType = 'light'): void {
    if (!this.hapticsEnabled || typeof navigator === 'undefined' || !('vibrate' in navigator)) {
      return;
    }

    const now = Date.now();
    // Throttle high-frequency haptic triggers (except strong cues)
    if (type === 'tick' || type === 'selection' || type === 'light') {
      if (now - this.lastHapticTime < 45) return;
    }
    this.lastHapticTime = now;

    try {
      switch (type) {
        case 'light':
        case 'selection':
          navigator.vibrate(8);
          break;
        case 'tick':
          navigator.vibrate(6);
          break;
        case 'snap':
          navigator.vibrate(14);
          break;
        case 'double':
          navigator.vibrate([10, 25, 12]);
          break;
        case 'medium':
          navigator.vibrate(22);
          break;
        case 'heavy':
          navigator.vibrate(35);
          break;
        case 'success':
          navigator.vibrate([18, 40, 24, 40, 32]);
          break;
        case 'warning':
          navigator.vibrate([35, 45, 35]);
          break;
        case 'error':
          navigator.vibrate([50, 40, 50, 40, 60]);
          break;
      }
    } catch {
      // Ignore vibration errors gracefully
    }
  }

  public triggerHaptic(type: 'tick' | 'double' | 'snap' | 'success' | 'warning' = 'tick'): void {
    this.hapticFeedback(type);
  }

  /**
   * Button Tap: Very short soft click (20-30ms)
   */
  public playButtonTap(): void {
    this.hapticFeedback('light');
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.022);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.024);
    } catch {
      // Non-blocking UI sound
    }
  }

  /**
   * Toggle Switch: Slightly brighter click (25-35ms)
   */
  public playSwitchSound(state: boolean): void {
    this.hapticFeedback('snap');
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(state ? 1500 : 800, now);
      osc.frequency.exponentialRampToValueAtTime(state ? 2000 : 400, now + 0.025);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Non-blocking
    }
  }

  /**
   * Knob / Slider Step: Tiny mechanical tick (15ms, throttled)
   */
  public playSliderTick(freq = 1800, gainLevel = 0.03): void {
    const nowMs = Date.now();
    if (nowMs - this.lastSoundTime < 40) return;
    this.lastSoundTime = nowMs;

    this.hapticFeedback('tick');
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.012);

      gain.gain.setValueAtTime(gainLevel, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.015);
    } catch {
      // Non-blocking
    }
  }

  /**
   * Reset Chime (Double click reset)
   */
  public playResetSound(): void {
    this.hapticFeedback('double');
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [
        { freq: 880, start: 0, dur: 0.05 },
        { freq: 1760, start: 0.035, dur: 0.07 },
      ].forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.04, now + start);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch {
      // Non-blocking
    }
  }

  /**
   * Preset Click / Snap
   */
  public playPresetClick(): void {
    this.hapticFeedback('snap');
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.025);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.038);
    } catch {
      // Non-blocking
    }
  }

  public playPresetSnap(): void {
    this.playPresetClick();
  }

  /**
   * Master Started Cue
   */
  public playMasterStart(): void {
    this.hapticFeedback('medium');
    if (!this.soundEnabled || !this.masteringCuesEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Non-blocking
    }
  }

  /**
   * Master / Export Success Chime (Studio grade warm harmonic sequence)
   */
  public playSuccessSound(): void {
    this.hapticFeedback('success');
    if (!this.soundEnabled || !this.masteringCuesEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [
        { freq: 523.25, start: 0, dur: 0.08 },
        { freq: 659.25, start: 0.06, dur: 0.1 },
        { freq: 783.99, start: 0.12, dur: 0.12 },
        { freq: 1046.5, start: 0.18, dur: 0.2 },
      ].forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.045, now + start);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch {
      // Non-blocking
    }
  }

  /**
   * Error / Warning Tone
   */
  public playErrorAlert(): void {
    this.hapticFeedback('error');
    if (!this.soundEnabled || !this.masteringCuesEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Non-blocking
    }
  }
}

export const soundHaptics = new SoundHapticsService();

