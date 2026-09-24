import { activationDetector } from './ActivationDetector';
import { speechRecognitionService } from './SpeechRecognitionService';
import { speechSynthesisService } from './SpeechSynthesisService';
import { VoiceActivityDetector } from './VoiceActivityDetector';
import {
  MicPermissionState,
  SpeechRecognitionResultPayload,
  VoiceActivationMode,
  VoiceActivationResult,
} from './voiceTypes';
import { solStore } from '../state/useSolStore';
import { audioReactiveService } from '../core/audio/AudioReactiveService';

export type CommandRecognizedCallback = (result: VoiceActivationResult) => void;

export class VoiceEngine {
  private _permissionState: MicPermissionState = 'UNAVAILABLE';
  private _activationMode: VoiceActivationMode = 'PUSH_TO_TALK';
  private _vad = new VoiceActivityDetector(0.04);

  public get vad(): VoiceActivityDetector {
    return this._vad;
  }

  private _commandCallbacks: Set<CommandRecognizedCallback> = new Set();
  private _transcriptCallbacks: Set<(payload: SpeechRecognitionResultPayload) => void> = new Set();

  constructor() {
    this._initializeEngine();
  }

  private _initializeEngine(): void {
    if (speechRecognitionService.isSupported()) {
      this._permissionState = 'AVAILABLE';
    } else {
      this._permissionState = 'UNAVAILABLE';
    }

    // Connect recognition events
    speechRecognitionService.onResult((payload) => {
      this._handleRecognitionResult(payload);
    });

    speechRecognitionService.onError((err) => {
      console.warn('[VoiceEngine] Recognition error:', err);
      if (err.includes('not-allowed') || err.includes('permission')) {
        this._permissionState = 'DENIED';
      }
    });

    speechRecognitionService.onEnd(() => {
      if (this._permissionState === 'LISTENING' && this._activationMode === 'PUSH_TO_TALK') {
        this._permissionState = 'AVAILABLE';
      }
    });

    // Connect TTS state events to Core state transitions
    speechSynthesisService.onStateChange((isSpeaking) => {
      if (isSpeaking) {
        solStore.setSolState('SPEAKING', true, 'TTS Output starting');
      } else {
        solStore.setSolState('IDLE', true, 'TTS Output finished');
      }
    });
  }

  public get permissionState(): MicPermissionState {
    return this._permissionState;
  }

  public get activationMode(): VoiceActivationMode {
    return this._activationMode;
  }

  public setActivationMode(mode: VoiceActivationMode): void {
    this._activationMode = mode;
  }

  public isSupported(): boolean {
    return speechRecognitionService.isSupported();
  }

  public async requestMicPermission(): Promise<MicPermissionState> {
    if (!this.isSupported()) {
      this._permissionState = 'UNAVAILABLE';
      return 'UNAVAILABLE';
    }

    this._permissionState = 'REQUESTING';
    const granted = await audioReactiveService.startListening();

    if (granted) {
      this._permissionState = 'AVAILABLE';
    } else {
      this._permissionState = 'DENIED';
    }

    return this._permissionState;
  }

  public async startListening(): Promise<boolean> {
    if (this._permissionState === 'DENIED' || !this.isSupported()) {
      return false;
    }

    const perm = await this.requestMicPermission();
    if (perm !== 'AVAILABLE') return false;

    const started = await speechRecognitionService.start();
    if (started) {
      this._permissionState = 'LISTENING';
      solStore.setSolState('LISTENING', true, 'Voice engine listening');
    }

    return started;
  }

  public stopListening(): void {
    speechRecognitionService.stop();
    if (this._permissionState === 'LISTENING') {
      this._permissionState = 'AVAILABLE';
      solStore.setSolState('IDLE', true, 'Voice engine stopped');
    }
  }

  public async speak(text: string): Promise<boolean> {
    if (!speechSynthesisService.isSupported()) {
      console.warn('[VoiceEngine] Speech synthesis unsupported.');
      return false;
    }

    return speechSynthesisService.speak(text);
  }

  public stopSpeaking(): void {
    speechSynthesisService.stop();
  }

  public onCommandRecognized(cb: CommandRecognizedCallback): () => void {
    this._commandCallbacks.add(cb);
    return () => this._commandCallbacks.delete(cb);
  }

  public onTranscriptUpdate(cb: (payload: SpeechRecognitionResultPayload) => void): () => void {
    this._transcriptCallbacks.add(cb);
    return () => this._transcriptCallbacks.delete(cb);
  }

  private _handleRecognitionResult(payload: SpeechRecognitionResultPayload): void {
    // Notify UI transcript observers
    this._transcriptCallbacks.forEach((cb) => cb(payload));

    const textToAnalyze = payload.isFinal ? payload.transcript : payload.interimTranscript;

    if (!textToAnalyze) return;

    // Transition state: LISTENING -> UNDERSTANDING on speech detection
    solStore.setSolState('UNDERSTANDING', true, 'Voice speech detected');

    // Run activation & command extraction detector
    const activationResult = activationDetector.detectActivation(textToAnalyze);

    if (activationResult.isActivated && payload.isFinal) {
      solStore.setSolState('THINKING', true, 'Wake-word activation confirmed');

      // Dispatch to command subscribers
      this._commandCallbacks.forEach((cb) => {
        try { cb(activationResult); } catch (err) { console.error('[VoiceEngine] Command cb error:', err); }
      });

      if (this._activationMode === 'PUSH_TO_TALK') {
        this.stopListening();
      }
    }
  }
}

export const voiceEngine = new VoiceEngine();
