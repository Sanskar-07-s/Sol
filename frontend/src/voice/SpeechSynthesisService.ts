import {
  ISpeechSynthesisProvider,
  SpeechSynthesisConfig,
  SpeechSynthesisStateCallback,
} from './voiceTypes';

export class SpeechSynthesisService implements ISpeechSynthesisProvider {
  private _synth: SpeechSynthesis | null = null;
  private _isSpeaking = false;
  private _stateCallbacks: Set<SpeechSynthesisStateCallback> = new Set();
  private _voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this._initializeProvider();
  }

  private _initializeProvider(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this._synth = window.speechSynthesis;
      this._loadVoices();
      if (this._synth.onvoiceschanged !== undefined) {
        this._synth.onvoiceschanged = () => this._loadVoices();
      }
    }
  }

  private _loadVoices(): void {
    if (this._synth) {
      this._voices = this._synth.getVoices();
    }
  }

  public isSupported(): boolean {
    return this._synth !== null;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this._voices.length === 0 && this._synth) {
      this._loadVoices();
    }
    return this._voices;
  }

  public speak(text: string, config?: Partial<SpeechSynthesisConfig>): Promise<boolean> {
    if (!this.isSupported() || !this._synth) {
      console.warn('[SpeechSynthesis] TTS Provider unsupported in this browser environment.');
      return Promise.resolve(false);
    }

    const trimmed = text.trim();
    if (!trimmed) return Promise.resolve(false);

    return new Promise((resolve) => {
      try {
        // Cancel ongoing synthesis before starting new utterance
        this._synth!.cancel();

        const utterance = new SpeechSynthesisUtterance(trimmed);
        utterance.rate = config?.rate ?? 1.0;
        utterance.pitch = config?.pitch ?? 1.0;
        utterance.volume = config?.volume ?? 1.0;

        if (config?.voice) {
          utterance.voice = config.voice;
        } else {
          // Prefer natural English voice if available
          const voices = this.getVoices();
          const preferredVoice = voices.find(
            (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural'))
          ) || voices.find((v) => v.lang.startsWith('en'));

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        }

        utterance.onstart = () => {
          this._setSpeakingState(true);
        };

        utterance.onend = () => {
          this._setSpeakingState(false);
          resolve(true);
        };

        utterance.onerror = (e) => {
          console.warn('[SpeechSynthesis] Utterance error:', e);
          this._setSpeakingState(false);
          resolve(false);
        };

        this._synth!.speak(utterance);
      } catch (err) {
        console.error('[SpeechSynthesis] Speak exception:', err);
        this._setSpeakingState(false);
        resolve(false);
      }
    });
  }

  public stop(): void {
    if (this._synth) {
      try {
        this._synth.cancel();
      } catch (err) {
        console.warn('[SpeechSynthesis] Cancel error:', err);
      }
      this._setSpeakingState(false);
    }
  }

  public pause(): void {
    if (this._synth && this._isSpeaking) {
      try {
        this._synth.pause();
      } catch (err) {
        console.warn('[SpeechSynthesis] Pause error:', err);
      }
    }
  }

  public resume(): void {
    if (this._synth && this._synth.paused) {
      try {
        this._synth.resume();
      } catch (err) {
        console.warn('[SpeechSynthesis] Resume error:', err);
      }
    }
  }

  public isSpeaking(): boolean {
    return this._isSpeaking || (this._synth ? this._synth.speaking : false);
  }

  public onStateChange(cb: SpeechSynthesisStateCallback): () => void {
    this._stateCallbacks.add(cb);
    return () => this._stateCallbacks.delete(cb);
  }

  private _setSpeakingState(speaking: boolean): void {
    if (this._isSpeaking !== speaking) {
      this._isSpeaking = speaking;
      this._stateCallbacks.forEach((cb) => {
        try { cb(speaking); } catch (err) { console.error('[SpeechSynthesis] State callback error:', err); }
      });
    }
  }
}

export const speechSynthesisService = new SpeechSynthesisService();
