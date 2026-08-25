/**
 * Sound & Haptics Service for MasteringLocal.Pro
 * 
 * Provides tactile haptic pulses and subtle synthesized analog UI audio feedback
 * for precision mastering controls (sliders, rotary knobs, bypass switches, resets).
 */

class SoundHapticsService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private hapticsEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedSound = localStorage.getItem('mastering_ui_sound_enabled');
      const savedHaptics = localStorage.getItem('mastering_ui_haptics_enabled');
      if (savedSound !== null) this.soundEnabled = savedSound === 'true';
      if (savedHaptics !== null) this.hapticsEnabled = savedHaptics === 'true';
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  /**
   * Trigger subtle tactile haptic vibration
   */
  public triggerHaptic(type: 'tick' | 'double' | 'snap' | 'success' | 'warning' = 'tick'): void {
    if (!this.hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) {
      return;
    }
    try {
      switch (type) {
        case 'tick':
          navigator.vibrate(8);
          break;
        case 'double':
          navigator.vibrate([12, 30, 15]);
          break;
        case 'snap':
          navigator.vibrate(18);
          break;
        case 'success':
          navigator.vibrate([20, 40, 30]);
          break;
        case 'warning':
          navigator.vibrate([40, 50, 40]);
          break;
      }
    } catch {
      // Ignore vibration errors
    }
  }

  /**
   * Play high-precision subtle synthesized mechanical / analog tick
   */
  public playSliderTick(freq = 1800, gainLevel = 0.04): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.015);

      gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.016);
    } catch {
      // Non-blocking UI audio
    }
  }

  /**
   * Play Double-Click Reset Chime
   */
  public playResetSound(): void {
    this.triggerHaptic('double');
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [
        { freq: 880, start: 0, dur: 0.06 },
        { freq: 1760, start: 0.04, dur: 0.08 },
      ].forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.05, now + start);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Play Switch Toggle Click
   */
  public playSwitchSound(state: boolean): void {
    this.triggerHaptic('snap');
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(state ? 1200 : 700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(state ? 1600 : 500, ctx.currentTime + 0.02);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.026);
    } catch {
      // Ignore
    }
  }

  /**
   * Play Preset Load Snap / Click
   */
  public playPresetSnap(): void {
    this.playPresetClick();
  }

  public playPresetClick(): void {
    this.triggerHaptic('snap');
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
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.03);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2500, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // Ignore
    }
  }

  /**
   * Play Master Success Chime
   */
  public playSuccessSound(): void {
    this.triggerHaptic('success');
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [
        { freq: 523.25, start: 0, dur: 0.1 },
        { freq: 659.25, start: 0.08, dur: 0.12 },
        { freq: 783.99, start: 0.16, dur: 0.15 },
        { freq: 1046.5, start: 0.24, dur: 0.3 },
      ].forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.06, now + start);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch {
      // Ignore
    }
  }
}

export const soundHaptics = new SoundHapticsService();
