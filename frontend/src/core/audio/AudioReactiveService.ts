/* ==========================================================================
   SOL AUDIO REACTIVE SERVICE
   Analyzes live microphone input using the Web Audio API with exponential smoothing.
   If permission is denied or unavailable, cleanly signals inactive status
   and falls back to zero amplitude (never faking simulated microphone data).
   ========================================================================== */

export interface AudioMetrics {
  amplitude: number;       // 0.0 to 1.0 smoothed amplitude
  rawPeak: number;         // 0.0 to 1.0 raw peak
  bassEnergy: number;      // 0.0 to 1.0 low-frequency spectral energy
  trebleEnergy: number;    // 0.0 to 1.0 high-frequency spectral energy
  isActive: boolean;       // whether live mic stream is currently feeding data
}

class AudioReactiveService {
  private _audioContext: AudioContext | null = null;
  private _analyser: AnalyserNode | null = null;
  private _mediaStream: MediaStream | null = null;
  private _sourceNode: MediaStreamAudioSourceNode | null = null;
  private _dataArray: Uint8Array | null = null;

  private _smoothedAmplitude = 0;
  private _isListening = false;
  private _hasPermission = false;
  private _errorMessage: string | null = null;

  public async startListening(): Promise<boolean> {
    if (this._isListening && this._audioContext) {
      if (this._audioContext.state === 'suspended') {
        await this._audioContext.resume();
      }
      return true;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Web Audio getUserMedia is unsupported in this environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this._mediaStream = stream;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this._audioContext = new AudioCtx();
      this._analyser = this._audioContext.createAnalyser();
      this._analyser.fftSize = 256;
      this._analyser.smoothingTimeConstant = 0.8;

      this._sourceNode = this._audioContext.createMediaStreamSource(stream);
      this._sourceNode.connect(this._analyser);

      this._dataArray = new Uint8Array(this._analyser.frequencyBinCount);
      this._isListening = true;
      this._hasPermission = true;
      this._errorMessage = null;

      return true;
    } catch (err: unknown) {
      this._isListening = false;
      this._hasPermission = false;
      this._errorMessage = err instanceof Error ? err.message : 'Microphone permission denied';
      console.warn('[SOL Audio Reactive] Microphone input unavailable:', this._errorMessage);
      return false;
    }
  }

  public stopListening(): void {
    if (this._mediaStream) {
      this._mediaStream.getTracks().forEach((track) => track.stop());
      this._mediaStream = null;
    }
    if (this._sourceNode) {
      this._sourceNode.disconnect();
      this._sourceNode = null;
    }
    if (this._audioContext) {
      this._audioContext.close();
      this._audioContext = null;
    }
    this._analyser = null;
    this._dataArray = null;
    this._isListening = false;
    this._smoothedAmplitude = 0;
  }

  /**
   * Sample current audio metrics per frame with exponential decay smoothing.
   */
  public getMetrics(delta: number): AudioMetrics {
    if (!this._isListening || !this._analyser || !this._dataArray) {
      // Smooth decay back to zero
      this._smoothedAmplitude += (0 - this._smoothedAmplitude) * Math.min(1.0, delta * 6.0);
      return {
        amplitude: this._smoothedAmplitude,
        rawPeak: 0,
        bassEnergy: 0,
        trebleEnergy: 0,
        isActive: false,
      };
    }

    this._analyser.getByteFrequencyData(this._dataArray);

    let sum = 0;
    let peak = 0;
    let bassSum = 0;
    let trebleSum = 0;
    const len = this._dataArray.length;
    const bassCutoff = Math.floor(len * 0.25);

    for (let i = 0; i < len; i++) {
      const val = this._dataArray[i] / 255.0;
      sum += val;
      if (val > peak) peak = val;
      if (i < bassCutoff) {
        bassSum += val;
      } else {
        trebleSum += val;
      }
    }

    const average = sum / len;
    const bass = bassSum / (bassCutoff || 1);
    const treble = trebleSum / (len - bassCutoff || 1);

    // Exponential smoothing for organic core response
    const smoothFactor = Math.min(1.0, delta * 12.0);
    this._smoothedAmplitude += (average - this._smoothedAmplitude) * smoothFactor;

    return {
      amplitude: this._smoothedAmplitude,
      rawPeak: peak,
      bassEnergy: bass,
      trebleEnergy: treble,
      isActive: true,
    };
  }

  public get isListening(): boolean {
    return this._isListening;
  }

  public get hasPermission(): boolean {
    return this._hasPermission;
  }

  public get errorMessage(): string | null {
    return this._errorMessage;
  }
}

export const audioReactiveService = new AudioReactiveService();
