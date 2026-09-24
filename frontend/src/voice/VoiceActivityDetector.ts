/* ==========================================================================
   SOL VOICE ACTIVITY DETECTOR (VAD)
   Samples spectral audio energy from Web Audio API stream to detect user speech.
   ========================================================================== */

export type VoiceActivityCallback = (isActive: boolean, amplitude: number) => void;

export class VoiceActivityDetector {
  private _threshold = 0.05;
  private _isActive = false;
  private _callbacks: Set<VoiceActivityCallback> = new Set();
  private _lastAmplitude = 0;

  constructor(threshold = 0.05) {
    this._threshold = threshold;
  }

  public update(amplitude: number): void {
    this._lastAmplitude = amplitude;
    const activeNow = amplitude > this._threshold;

    if (this._isActive !== activeNow) {
      this._isActive = activeNow;
      this._notify(activeNow, amplitude);
    }
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get lastAmplitude(): number {
    return this._lastAmplitude;
  }

  public onActivityChange(cb: VoiceActivityCallback): () => void {
    this._callbacks.add(cb);
    return () => this._callbacks.delete(cb);
  }

  private _notify(isActive: boolean, amplitude: number): void {
    this._callbacks.forEach((cb) => {
      try {
        cb(isActive, amplitude);
      } catch (err) {
        console.error('[VAD] Callback error:', err);
      }
    });
  }
}
