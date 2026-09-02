import { audioEngine } from './audio-engine';

export interface StemState {
  id: string;
  gain: number;
  pan: number;
  muted: boolean;
  solo: boolean;
}

type EngineInternals = {
  processorNode: AudioNode | null;
  analyserOut: AudioNode | null;
};

type StemNodes = {
  gain: GainNode;
  pan: StereoPannerNode;
};

/**
 * Live stem-control mixer for the current mastering graph.
 *
 * The application currently exposes one decoded stereo program buffer, not
 * four independent decoded stem buffers. Until true stem sources exist, the
 * processor output is fanned out into four real control channels. Each
 * channel has an independent GainNode and StereoPannerNode and is summed into
 * a dedicated master bus before the existing output analyser.
 *
 * The public control API is intentionally stem-shaped so future real stem
 * AudioBufferSourceNodes can replace the shared processor input without
 * changing StemsModal.
 */
class StemMixer {
  private ctx: AudioContext | null = null;
  private nodes = new Map<string, StemNodes>();
  private states = new Map<string, StemState>();
  private masterBus: GainNode | null = null;
  private attached = false;
  private installed = false;
  private enabled = false;

  public install(): void {
    this.enabled = true;
    if (this.installed) return;

    this.installed = true;

    const engine = audioEngine as unknown as {
      play: (offset?: number) => Promise<void>;
      stop: (resetOffset?: boolean) => void;
    };

    const originalPlay = engine.play.bind(audioEngine);
    const originalStop = engine.stop.bind(audioEngine);

    engine.play = async (offset?: number) => {
      await originalPlay(offset);
      if (this.enabled) this.attach();
    };

    engine.stop = (resetOffset?: boolean) => {
      this.detach(false);
      originalStop(resetOffset);
    };
  }

  public setStates(states: StemState[]): void {
    this.states.clear();
    for (const state of states) {
      this.states.set(state.id, { ...state });
    }
    this.sync();
  }

  public setPan(id: string, pan: number): void {
    const state = this.states.get(id);
    if (!state) return;

    state.pan = Math.max(-100, Math.min(100, pan));
    this.states.set(id, state);

    const node = this.nodes.get(id);
    if (node && this.ctx) {
      node.pan.pan.setTargetAtTime(
        state.pan / 100,
        this.ctx.currentTime,
        0.015,
      );
    }
  }

  /**
   * Gain is supplied by the UI in dB. Convert to linear amplitude before the
   * Web Audio GainNode and smooth the transition to avoid zipper noise.
   */
  public setVolume(id: string, gainDb: number): void {
    const state = this.states.get(id);
    if (!state) return;

    state.gain = Math.max(-12, Math.min(12, gainDb));
    this.states.set(id, state);
    this.syncGain(id);
  }

  public setMuted(id: string, muted: boolean): void {
    const state = this.states.get(id);
    if (!state) return;

    state.muted = muted;
    this.states.set(id, state);
    this.syncGain(id);
  }

  public setSolo(id: string, solo: boolean): void {
    const state = this.states.get(id);
    if (!state) return;

    state.solo = solo;
    this.states.set(id, state);
    this.syncAllGains();
  }

  /**
   * Attach the live mixer to the current mastering processor output.
   * Safe to call repeatedly because old mixer nodes are disconnected first.
   */
  public attach(): void {
    if (!this.enabled) return;

    const internals = audioEngine as unknown as EngineInternals;
    const processor = internals.processorNode;
    const analyserOut = internals.analyserOut;
    if (!processor || !analyserOut) return;

    const ctx = audioEngine.getAudioContext();
    this.ctx = ctx;

    if (this.attached) {
      this.detach(false);
    }

    // The normal engine path is processor -> analyserOut. Replace that direct
    // path with processor -> [stem gain/pan] -> master bus -> analyserOut.
    try {
      processor.disconnect(analyserOut);
    } catch {
      // The direct path may already be disconnected.
    }

    this.masterBus = ctx.createGain();
    this.masterBus.gain.setValueAtTime(1, ctx.currentTime);
    this.masterBus.connect(analyserOut);

    for (const state of this.states.values()) {
      const gain = ctx.createGain();
      const pan = ctx.createStereoPanner();

      gain.connect(pan);
      pan.connect(this.masterBus);
      processor.connect(gain);

      this.nodes.set(state.id, { gain, pan });
      pan.pan.setTargetAtTime(state.pan / 100, ctx.currentTime, 0.015);
    }

    this.attached = true;
    this.syncAllGains();
  }

  /**
   * Disconnect all stem nodes. When requested, restore the engine's direct
   * processor -> analyser path and deactivate the modal-owned hook.
   */
  public detach(restoreDirectPath = true): void {
    const internals = audioEngine as unknown as EngineInternals;
    const processor = internals.processorNode;
    const analyserOut = internals.analyserOut;

    for (const node of this.nodes.values()) {
      try {
        node.gain.disconnect();
      } catch {
        // Already disconnected.
      }
      try {
        node.pan.disconnect();
      } catch {
        // Already disconnected.
      }
    }
    this.nodes.clear();

    if (this.masterBus) {
      try {
        this.masterBus.disconnect();
      } catch {
        // Already disconnected.
      }
      this.masterBus = null;
    }

    this.attached = false;

    if (restoreDirectPath && processor && analyserOut) {
      try {
        processor.connect(analyserOut);
      } catch {
        // Already connected.
      }
      this.enabled = false;
    }
  }

  /** Disable the modal-owned mixer and restore the normal direct path. */
  public deactivate(): void {
    this.enabled = false;
    this.detach(true);
  }

  private sync(): void {
    if (!this.attached) return;

    for (const state of this.states.values()) {
      const node = this.nodes.get(state.id);
      if (!node || !this.ctx) continue;

      node.pan.pan.setTargetAtTime(
        state.pan / 100,
        this.ctx.currentTime,
        0.015,
      );
    }

    this.syncAllGains();
  }

  private syncAllGains(): void {
    for (const state of this.states.values()) {
      this.syncGain(state.id);
    }
  }

  private syncGain(id: string): void {
    const state = this.states.get(id);
    const node = this.nodes.get(id);
    if (!state || !node || !this.ctx) return;

    const anySolo = Array.from(this.states.values()).some((stem) => stem.solo);
    const audible = !state.muted && (!anySolo || state.solo);

    // The current source is the same program mix on all four control inputs.
    // 0.25 per path preserves unity at four default channels; soloing restores
    // unity for the selected channel while non-solo channels are muted.
    const baseLinear = Math.pow(10, state.gain / 20) * 0.25;
    const targetGain = audible ? baseLinear * (anySolo ? 4 : 1) : 0;

    node.gain.gain.setTargetAtTime(
      targetGain,
      this.ctx.currentTime,
      0.015,
    );
  }
}

export const stemMixer = new StemMixer();
