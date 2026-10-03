import {
  ISpeechRecognitionProvider,
  SpeechRecognitionCallback,
  SpeechRecognitionErrorCallback,
  SpeechRecognitionResultPayload,
} from './voiceTypes';

// Extended type definitions for Web Speech API
interface IWebSpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface IWebSpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface IWebSpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: IWebSpeechRecognitionEvent) => void) | null;
  onerror: ((e: IWebSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface IWebSpeechRecognitionConstructor {
  new (): IWebSpeechRecognitionInstance;
}

export class SpeechRecognitionService implements ISpeechRecognitionProvider {
  private _recognition: IWebSpeechRecognitionInstance | null = null;
  private _isListening = false;
  private _shouldKeepListening = false;
  private _isMutedForTTS = false;
  private _sessionGeneration = 0;
  private _restartTimer: ReturnType<typeof setTimeout> | null = null;

  private _transcript = '';
  private _interimTranscript = '';
  private _confidence = 0;
  private _lastError: string | null = null;

  private _resultCallbacks: Set<SpeechRecognitionCallback> = new Set();
  private _errorCallbacks: Set<SpeechRecognitionErrorCallback> = new Set();
  private _endCallbacks: Set<() => void> = new Set();

  constructor() {
    this._initializeProvider();
  }

  private _initializeProvider(): void {
    if (typeof window === 'undefined') return;

    const win = window as unknown as {
      SpeechRecognition?: IWebSpeechRecognitionConstructor;
      webkitSpeechRecognition?: IWebSpeechRecognitionConstructor;
    };

    const SpeechConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechConstructor) {
      try {
        this._recognition = new SpeechConstructor();
        this._recognition.continuous = true;
        this._recognition.interimResults = true;
        this._recognition.lang = 'en-US';

        this._recognition.onresult = (e: IWebSpeechRecognitionEvent) => {
          // If SOL is actively speaking TTS, ignore mic recognition so SOL doesn't hear itself
          if (this._isMutedForTTS) {
            return;
          }

          let finalStr = '';
          let interimStr = '';
          let maxConf = 0;

          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            const item = res[0];
            if (item) {
              if (res.isFinal) {
                finalStr += item.transcript + ' ';
                if (item.confidence > maxConf) maxConf = item.confidence;
              } else {
                interimStr += item.transcript;
              }
            }
          }

          if (finalStr) {
            this._transcript = (this._transcript + ' ' + finalStr).trim();
          }
          this._interimTranscript = interimStr.trim();
          if (maxConf > 0) this._confidence = maxConf;

          const payload: SpeechRecognitionResultPayload = {
            transcript: this._transcript,
            interimTranscript: this._interimTranscript,
            confidence: this._confidence || 0.9,
            isFinal: !!finalStr,
          };

          this._resultCallbacks.forEach((cb) => {
            try { cb(payload); } catch (err) { console.error('[SpeechRecognition] Callback error:', err); }
          });

          // Reset final accumulator once passed
          if (finalStr) {
            this._transcript = '';
          }
        };

        this._recognition.onerror = (e: IWebSpeechRecognitionErrorEvent) => {
          const err = e.error || 'Speech recognition error';

          // Normal passive events: no-speech and aborted are expected when user is quiet
          if (err === 'no-speech' || err === 'aborted') {
            return;
          }

          console.warn('[SpeechRecognition] Provider error:', err);

          if (err === 'not-allowed' || err === 'permission-denied') {
            this._shouldKeepListening = false;
            this._lastError = 'Microphone permission is required for voice activation.';
            this._errorCallbacks.forEach((cb) => {
              try { cb(this._lastError!); } catch (cErr) { console.error('[SpeechRecognition] Error callback error:', cErr); }
            });
            return;
          }

          this._lastError = err;
          this._errorCallbacks.forEach((cb) => {
            try { cb(this._lastError!); } catch (cErr) { console.error('[SpeechRecognition] Error callback error:', cErr); }
          });
        };

        this._recognition.onend = () => {
          this._isListening = false;

          this._endCallbacks.forEach((cb) => {
            try { cb(); } catch (err) { console.error('[SpeechRecognition] End callback error:', err); }
          });

          // Controlled persistent restart loop for passive listening
          if (this._shouldKeepListening && !this._isMutedForTTS) {
            this._scheduleRestart();
          }
        };
      } catch (err) {
        console.warn('[SpeechRecognition] Provider initialization error:', err);
        this._recognition = null;
      }
    }
  }

  private _scheduleRestart(): void {
    if (this._restartTimer) {
      clearTimeout(this._restartTimer);
    }

    const currentGen = ++this._sessionGeneration;

    this._restartTimer = setTimeout(() => {
      this._restartTimer = null;
      if (this._shouldKeepListening && !this._isListening && currentGen === this._sessionGeneration) {
        this.start().catch((err) => {
          console.warn('[SpeechRecognition] Auto-restart attempt error:', err);
        });
      }
    }, 250);
  }

  public isSupported(): boolean {
    return this._recognition !== null;
  }

  public setMutedForTTS(muted: boolean): void {
    this._isMutedForTTS = muted;
    if (muted) {
      this._transcript = '';
      this._interimTranscript = '';
    } else if (this._shouldKeepListening && !this._isListening) {
      this._scheduleRestart();
    }
  }

  public start(): Promise<boolean> {
    if (!this.isSupported() || !this._recognition) {
      this._lastError = 'VOICE // UNAVAILABLE (Speech Recognition API unsupported in current browser)';
      this._errorCallbacks.forEach((cb) => cb(this._lastError!));
      return Promise.resolve(false);
    }

    if (this._isListening) {
      return Promise.resolve(true);
    }

    this._shouldKeepListening = true;

    return new Promise((resolve) => {
      try {
        this._transcript = '';
        this._interimTranscript = '';
        this._confidence = 0;
        this._lastError = null;

        this._recognition!.start();
        this._isListening = true;
        resolve(true);
      } catch (err) {
        this._isListening = false;
        const msg = err instanceof Error ? err.message : 'Speech recognition start failure';
        // If already started, mark listening true
        if (msg.toLowerCase().includes('already started')) {
          this._isListening = true;
          resolve(true);
          return;
        }
        this._lastError = msg;
        this._errorCallbacks.forEach((cb) => cb(this._lastError!));
        resolve(false);
      }
    });
  }

  public stop(): void {
    this._shouldKeepListening = false;
    if (this._restartTimer) {
      clearTimeout(this._restartTimer);
      this._restartTimer = null;
    }

    if (this._recognition && this._isListening) {
      try {
        this._recognition.stop();
      } catch (err) {
        console.warn('[SpeechRecognition] Stop error:', err);
      }
      this._isListening = false;
    }
  }

  public isListening(): boolean {
    return this._isListening;
  }

  public getTranscript(): string {
    return this._transcript;
  }

  public getInterimTranscript(): string {
    return this._interimTranscript;
  }

  public getConfidence(): number {
    return this._confidence;
  }

  public getLastError(): string | null {
    return this._lastError;
  }

  public onResult(cb: SpeechRecognitionCallback): () => void {
    this._resultCallbacks.add(cb);
    return () => this._resultCallbacks.delete(cb);
  }

  public onError(cb: SpeechRecognitionErrorCallback): () => void {
    this._errorCallbacks.add(cb);
    return () => this._errorCallbacks.delete(cb);
  }

  public onEnd(cb: () => void): () => void {
    this._endCallbacks.add(cb);
    return () => this._endCallbacks.delete(cb);
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
