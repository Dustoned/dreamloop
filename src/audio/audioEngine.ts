import type { AudioFrame } from '../state/types';

export type AudioSourceKind = 'none' | 'file' | 'tab' | 'mic';

/**
 * One AudioContext for the app. Graph: source -> [analyser, speakers?, recordTap].
 * The analyser fills a mutable AudioFrame each frame (read directly by the
 * engine, zero events); source/error changes notify UI subscribers.
 */
class AudioEngine {
  frame: AudioFrame = { bass: 0, mid: 0, treble: 0, beat: 0 };
  kind: AudioSourceKind = 'none';
  error = '';
  trackName = '';
  audioEl: HTMLAudioElement | null = null;
  /** Tap for future video recording: captures exactly what plays. */
  recordTap: MediaStreamAudioDestinationNode | null = null;

  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private sourceNode: AudioNode | null = null;
  private fileNode: MediaElementAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private listeners = new Set<() => void>();

  private sm = { bass: 0, mid: 0, treble: 0 };
  /**
   * Rolling loudness window per band, for the auto-gain in bands(). getByteFrequency
   * maps -100..-30 dB onto 0..255, and ordinary music sits near the top of that
   * for bass, so the raw value was pinned around 0.9 the whole time. Every
   * bass-linked slider then sat at its maximum instead of moving with the music,
   * which is what made the reactions feel violent even at low Audio Reactivity.
   */
  private gain = {
    bass: { lo: 1, hi: 0 },
    mid: { lo: 1, hi: 0 },
    treble: { lo: 1, hi: 0 },
  };
  private beatAvg = 0;
  private beatCooldown = 0;
  private beatEnv = 0;

  /** Seconds since the last analysis, so the window adapts in real time rather
   * than in frames — otherwise a 144 Hz display adapts 2.4x faster than a 60 Hz one. */
  private lastAt = 0;

  /**
   * Where `raw` sits between this band's recent quiet and loud, as 0..1.
   *
   * The floor is the subtle half. Every track begins in silence, so a floor that
   * latched on the first quiet sample would sit at 0 for the whole song, and the
   * normalisation would collapse back to raw/hi — which is the very pinning this
   * exists to remove. So the floor ignores near-silence and climbs back roughly
   * three times faster than the ceiling falls.
   */
  private agc(w: { lo: number; hi: number }, raw: number, dt: number): number {
    const fall = 1 - Math.exp(-dt / 9); // ceiling forgets a peak over ~9 s
    const rise = 1 - Math.exp(-dt / 3); // floor catches up over ~3 s
    w.hi = raw > w.hi ? raw : w.hi + (raw - w.hi) * fall;
    if (raw > 0.02) {
      w.lo = raw < w.lo ? raw : w.lo + (raw - w.lo) * rise;
    }
    if (w.hi < 0.02) return 0; // silence: nothing to normalise
    return Math.min(1, Math.max(0, (raw - w.lo) / Math.max(w.hi - w.lo, 0.06)));
  }

  /** A new source has its own loudness; the previous one's window would mis-scale it. */
  private resetLevels(): void {
    this.gain = { bass: { lo: 1, hi: 0 }, mid: { lo: 1, hi: 0 }, treble: { lo: 1, hi: 0 } };
    this.sm = { bass: 0, mid: 0, treble: 0 };
    this.beatAvg = 0;
    this.beatEnv = 0;
    this.beatCooldown = 0;
    this.lastAt = 0;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  get tabAudioSupported(): boolean {
    return !!navigator.mediaDevices?.getDisplayMedia;
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.4;
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.recordTap = this.ctx.createMediaStreamDestination();
    }
    void this.ctx.resume();
    return this.ctx;
  }

  private disconnectSource(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        /* already disconnected */
      }
      this.sourceNode = null;
    }
  }

  private stopStream(): void {
    if (this.stream) {
      for (const t of this.stream.getTracks()) t.stop();
      this.stream = null;
    }
  }

  private connect(node: AudioNode, toSpeakers: boolean): void {
    this.disconnectSource();
    this.sourceNode = node;
    node.connect(this.analyser!);
    if (toSpeakers) node.connect(this.ctx!.destination);
    node.connect(this.recordTap!);
  }

  async useFile(file: File): Promise<void> {
    try {
      const ctx = this.ensureCtx();
      this.stopStream();
      if (!this.audioEl) {
        this.audioEl = new Audio();
        this.audioEl.loop = true;
        // createMediaElementSource may only be called once per element
        this.fileNode = ctx.createMediaElementSource(this.audioEl);
      }
      if (this.audioEl.src) URL.revokeObjectURL(this.audioEl.src);
      this.audioEl.src = URL.createObjectURL(file);
      this.connect(this.fileNode!, true);
      this.resetLevels();
      await this.audioEl.play();
      this.kind = 'file';
      this.trackName = file.name;
      this.error = '';
    } catch {
      this.error = 'Could not play this file. Try an MP3, WAV or OGG.';
    }
    this.emit();
  }

  async useMic(): Promise<void> {
    try {
      const ctx = this.ensureCtx();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.pauseFile();
      this.stopStream();
      this.stream = stream;
      // never route the mic to the speakers (feedback loop)
      this.connect(ctx.createMediaStreamSource(stream), false);
      this.resetLevels();
      stream.getAudioTracks()[0]?.addEventListener('ended', () => this.stop());
      this.kind = 'mic';
      this.trackName = '';
      this.error = '';
    } catch {
      this.error =
        'Microphone access was denied. Click the lock icon next to the address bar to allow it, then try again.';
    }
    this.emit();
  }

  async useTab(): Promise<void> {
    try {
      const ctx = this.ensureCtx();
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      if (!stream.getAudioTracks().length) {
        for (const t of stream.getTracks()) t.stop();
        this.error = "No audio came through. Tick 'Share audio' when choosing the tab.";
        this.emit();
        return;
      }
      for (const t of stream.getVideoTracks()) t.stop();
      this.pauseFile();
      this.stopStream();
      this.stream = stream;
      // the shared tab already plays its own audio
      this.connect(ctx.createMediaStreamSource(stream), false);
      this.resetLevels();
      stream.getAudioTracks()[0].addEventListener('ended', () => this.stop());
      this.kind = 'tab';
      this.trackName = '';
      this.error = '';
    } catch {
      this.error = 'Sharing was cancelled.';
    }
    this.emit();
  }

  private pauseFile(): void {
    this.audioEl?.pause();
  }

  toggleFilePlayback(): void {
    if (!this.audioEl) return;
    if (this.audioEl.paused) void this.audioEl.play();
    else this.audioEl.pause();
    this.emit();
  }

  stop(): void {
    this.disconnectSource();
    this.stopStream();
    this.pauseFile();
    this.kind = 'none';
    this.trackName = '';
    this.error = '';
    this.frame.bass = this.frame.mid = this.frame.treble = this.frame.beat = 0;
    this.resetLevels();
    this.emit();
  }

  /** Called once per rendered frame from the main loop. */
  update(): void {
    const f = this.frame;
    if (!this.analyser || this.kind === 'none') {
      f.bass *= 0.9;
      f.mid *= 0.9;
      f.treble *= 0.9;
      f.beat *= 0.9;
      return;
    }
    const d = this.freqData!;
    this.analyser.getByteFrequencyData(d);
    // fftSize 2048 @ ~48kHz -> ~23.4 Hz per bin
    const avg = (a: number, b: number) => {
      let s = 0;
      for (let i = a; i < b; i++) s += d[i];
      return s / (b - a) / 255;
    };
    const rawBass = avg(1, 11); // ~23-260 Hz
    const rawMid = avg(11, 86); // ~260-2000 Hz
    const rawTreble = avg(86, 513); // ~2-12 kHz

    // Normalise against this track's own dynamics first, then smooth with a fast
    // attack and slow release.
    const sm = (cur: number, raw: number) =>
      raw > cur ? cur + (raw - cur) * 0.55 : cur + (raw - cur) * 0.12;
    const now = performance.now() / 1000;
    const dt = this.lastAt > 0 ? Math.min(0.25, Math.max(0.001, now - this.lastAt)) : 0.016;
    this.lastAt = now;
    this.sm.bass = sm(this.sm.bass, this.agc(this.gain.bass, rawBass, dt));
    this.sm.mid = sm(this.sm.mid, this.agc(this.gain.mid, rawMid, dt));
    this.sm.treble = sm(this.sm.treble, this.agc(this.gain.treble, rawTreble, dt));
    f.bass = this.sm.bass;
    f.mid = this.sm.mid;
    f.treble = this.sm.treble;

    // beat: bass energy spike vs rolling average, with a refractory period
    this.beatAvg = this.beatAvg * 0.985 + rawBass * 0.015;
    this.beatCooldown = Math.max(0, this.beatCooldown - 1);
    if (this.beatCooldown === 0 && rawBass > 0.15 && rawBass > this.beatAvg * 1.45) {
      this.beatEnv = 1;
      this.beatCooldown = 14;
    }
    this.beatEnv *= 0.92;
    f.beat = this.beatEnv;
  }
}

export const audio = new AudioEngine();
