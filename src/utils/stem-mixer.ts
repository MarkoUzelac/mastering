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

/**
 * Runtime stem bus for the existing mastering graph.
 *
 * The current repository exposes a single mastered program signal rather than
 * four decoded stem sources. This mixer therefore provides a real parallel
 * stem-control bus around that signal: every control changes an actual
 * GainNode/StereoPannerNode in the live Web Audio graph. When true separated
 * stem sources are introduced later, connect them to these four inputs instead
 * of duplicating the program signal.
 */
class StemMixer {
  private ctx: AudioContext | null = null;
  private nodes = new Map<string, { gain: GainNode; pan: StereoPannerNode }>();
  private states = new Map<string, StemState>();
  private attached = false;
  private installed = false;

  public install(): void {
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
      this.attach();
    };

    engine.stop = (resetOffset?: boolean) => {
      this.detach();
      originalStop(resetOffset);
    };
  }

  public setStates(states: StemState[]): void {
    this.states.clear();
    for (const state of states) this.states.set(state.id, { ...state });
    this.sync();
  }

  public setPan(id: string, pan: number): void {
    const state = this.states.get(id);
    if (!state) return;
    state.pan = Math.max(-100, Math.min(100, pan));
    this.states.set(id, state);
    const node = this.nodes.get(id);
    if (node && this.ctx) {
      node.pan.pan.setTargetAtTime(state.pan / 100, this.ctx.currentTime, 0.015);
    }
  }

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

  public attach(): void {
    const internals = audioEngine as unknown as EngineInternals;
    const processor = internals.processorNode;
    const analyserOut = internals.analyserOut;
    if (!processor || !analyserOut) return;

    const ctx = audioEngine.getAudioContext();
    this.ctx = ctx;

    // Re-attach safely if the engine recreated its processor node on play.
    if (this.attached) this.detach(false);

    try {
      processor.disconnect(analyserOut);
    } catch {
      // The processor may not have an analyserOut connection yet.
    }

    for (const state of this.states.values()) {
      const gain = ctx.createGain();
      const pan = ctx.createStereoPanner();
      gain.connect(pan);
      pan.connect(analyserOut);
      this.nodes.set(state.id, { gain, pan });

      pan.pan.setTargetAtTime(state.pan / 100, ctx.currentTime, 0.015);
    }

    this.attached = true;
    this.syncAllGains();
  }

  public detach(restoreDirectPath = true): void {
    const internals = audioEngine as unknown as EngineInternals;
    const processor = internals.processorNode;
    const analyserOut = internals.analyserOut;

    for (const node of this.nodes.values()) {
      try { node.gain.disconnect(); } catch { /* already disconnected */ }
      try { node.pan.disconnect(); } catch { /* already disconnected */ }
    }
    this.nodes.clear();
    this.attached = false;

    if (restoreDirectPath && processor && analyserOut) {
      try { processor.connect(analyserOut); } catch { /* already connected */ }
    }
  }

  private sync(): void {
    if (!this.attached) return;
    for (const state of this.states.values()) {
      const node = this.nodes.get(state.id);
      if (!node || !this.ctx) continue;
      node.pan.pan.setTargetAtTime(state.pan / 100, this.ctx.currentTime, 0.015);
    }
    this.syncAllGains();
  }

  private syncAllGains(): void {
    for (const state of this.states.values()) this.syncGain(state.id);
  }

  private syncGain(id: string): void {
    const state = this.states.get(id);
    const node = this.nodes.get(id);
    if (!state || !node || !this.ctx) return;

    const anySolo = Array.from(this.states.values()).some((stem) => stem.solo);
    const audible = !state.muted && (!anySolo || state.solo);

    // Four-way program preview: each non-solo stem contributes 25%, while a
    // solo stem is compensated to unity so soloing does not unexpectedly drop
    // the master level. Multiple soloed stems intentionally sum normally.
    const baseLinear = Math.pow(10, state.gain / 20) * 0.25;
    const targetGain = audible ? baseLinear * (anySolo ? 4 : 1) : 0;

    node.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.015);
  }
}

export const stemMixer = new StemMixer();
