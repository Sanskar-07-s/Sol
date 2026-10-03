import { activationDetector } from './ActivationDetector';
import { speechRecognitionService } from './SpeechRecognitionService';
import { speechSynthesisService } from './SpeechSynthesisService';
import { VoiceActivityDetector } from './VoiceActivityDetector';
import {
  MicPermissionState,
  SpeechRecognitionResultPayload,
  VoiceActivationMode,
  VoiceActivationResult,
  VoiceLifecycleState,
} from './voiceTypes';
import { solStore } from '../state/useSolStore';
import { audioReactiveService } from '../core/audio/AudioReactiveService';

export type CommandRecognizedCallback = (result: VoiceActivationResult) => void;
export type VoiceLifecycleCallback = (state: VoiceLifecycleState) => void;

export class VoiceEngine {
  private _permissionState: MicPermissionState = 'UNAVAILABLE';
  private _lifecycleState: VoiceLifecycleState = 'MIC_OFF';
  private _activationMode: VoiceActivationMode = 'VOICE_ACTIVATION';
  private _vad = new VoiceActivityDetector(0.04);

  // Two-Stage Voice State Machine
  private _stage: 'PASSIVE' | 'ACTIVATED_AWAITING_COMMAND' = 'PASSIVE';
  private _stageTimeout: ReturnType<typeof setTimeout> | null = null;

  public get vad(): VoiceActivityDetector {
    return this._vad;
  }

  public get lifecycleState(): VoiceLifecycleState {
    return this._lifecycleState;
  }

  private _commandCallbacks: Set<CommandRecognizedCallback> = new Set();
  private _transcriptCallbacks: Set<(payload: SpeechRecognitionResultPayload) => void> = new Set();
  private _lifecycleCallbacks: Set<VoiceLifecycleCallback> = new Set();

  constructor() {
    this._initializeEngine();
  }

  private _setLifecycle(state: VoiceLifecycleState): void {
    if (this._lifecycleState !== state) {
      this._lifecycleState = state;
      solStore.setVoiceLifecycleState(state);
      this._lifecycleCallbacks.forEach((cb) => {
        try { cb(state); } catch (err) { console.error('[VoiceEngine] Lifecycle callback error:', err); }
      });
    }
  }

  private _initializeEngine(): void {
    if (speechRecognitionService.isSupported()) {
      this._permissionState = 'AVAILABLE';
      this._setLifecycle('MIC_OFF');
    } else {
      this._permissionState = 'UNAVAILABLE';
      this._setLifecycle('MIC_ERROR');
    }

    // Connect recognition events
    speechRecognitionService.onResult((payload) => {
      this._handleRecognitionResult(payload);
    });

    speechRecognitionService.onError((err) => {
      console.warn('[VoiceEngine] Recognition error:', err);
      if (err.includes('permission') || err.includes('not-allowed')) {
        this._permissionState = 'DENIED';
        this._setLifecycle('MIC_ERROR');
        solStore.setContextualMessage({
          id: `msg-${Date.now()}`,
          sender: 'system',
          content: 'Microphone permission is required for voice activation. Please enable microphone access in your browser.',
          timestamp: Date.now(),
        });
      } else {
        this._setLifecycle('RECOVERING');
      }
    });

    speechRecognitionService.onEnd(() => {
      if (this._lifecycleState === 'PASSIVE_LISTENING') {
        // Recognition onend occurred during passive mode; verifier auto-restart handles loop
        this._setLifecycle('PASSIVE_LISTENING');
      }
    });

    // Connect TTS state events to Core and Voice lifecycles
    speechSynthesisService.onStateChange((isSpeaking) => {
      if (isSpeaking) {
        this._setLifecycle('SPEAKING');
        speechRecognitionService.setMutedForTTS(true);
        solStore.setSolState('SPEAKING', true, 'TTS Output starting');
      } else {
        speechRecognitionService.setMutedForTTS(false);
        if (this._permissionState === 'LISTENING') {
          this._setLifecycle('PASSIVE_LISTENING');
        } else {
          this._setLifecycle('MIC_OFF');
        }
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
      this._setLifecycle('MIC_ERROR');
      return 'UNAVAILABLE';
    }

    this._permissionState = 'REQUESTING';
    this._setLifecycle('INITIALIZING');
    const granted = await audioReactiveService.startListening();

    if (granted) {
      this._permissionState = 'AVAILABLE';
    } else {
      this._permissionState = 'DENIED';
      this._setLifecycle('MIC_ERROR');
    }

    return this._permissionState;
  }

  /**
   * Starts persistent background voice listening.
   * Maintains always-ready passive listening loop.
   */
  public async startListening(): Promise<boolean> {
    if (this._permissionState === 'DENIED' || !this.isSupported()) {
      return false;
    }

    const perm = await this.requestMicPermission();
    if (perm !== 'AVAILABLE') return false;

    const started = await speechRecognitionService.start();
    if (started) {
      this._permissionState = 'LISTENING';
      this._stage = 'PASSIVE';
      this._setLifecycle('PASSIVE_LISTENING');
      solStore.setSolState('IDLE', true, 'Voice engine passive listening active');
    }

    return started;
  }

  /**
   * Stops voice listening and releases microphone resources.
   */
  public stopListening(): void {
    this._clearStageTimeout();
    this._stage = 'PASSIVE';
    speechRecognitionService.stop();
    audioReactiveService.stopListening();

    if (this._permissionState === 'LISTENING') {
      this._permissionState = 'AVAILABLE';
      this._setLifecycle('MIC_OFF');
      solStore.setSolState('IDLE', true, 'Voice engine stopped');
    }
  }

  public async speak(text: string): Promise<boolean> {
    const { voiceSettings } = solStore.getState();
    if (!voiceSettings.enabled) {
      console.log('[VoiceEngine] Voice output disabled in settings. Skipping TTS playback.');
      return false;
    }
    if (!speechSynthesisService.isSupported()) {
      console.warn('[VoiceEngine] Speech synthesis unsupported.');
      return false;
    }

    const voices = speechSynthesisService.getVoices();
    const voice = voices.find((v) => v.voiceURI === voiceSettings.selectedVoiceURI);

    return speechSynthesisService.speak(text, {
      volume: voiceSettings.volume,
      rate: voiceSettings.rate,
      pitch: voiceSettings.pitch,
      voice: voice || undefined,
    });
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

  public onLifecycleChange(cb: VoiceLifecycleCallback): () => void {
    this._lifecycleCallbacks.add(cb);
    return () => this._lifecycleCallbacks.delete(cb);
  }

  private _clearStageTimeout(): void {
    if (this._stageTimeout) {
      clearTimeout(this._stageTimeout);
      this._stageTimeout = null;
    }
  }

  /**
   * Two-Stage Speech Recognition Event Handler
   */
  private _handleRecognitionResult(payload: SpeechRecognitionResultPayload): void {
    this._transcriptCallbacks.forEach((cb) => cb(payload));

    const textToAnalyze = (payload.isFinal ? payload.transcript : payload.interimTranscript).trim();
    if (!textToAnalyze) return;

    // STAGE 1: PASSIVE LISTENING (Waiting for wake word "Hey SOL" or wake + command)
    if (this._stage === 'PASSIVE') {
      const activation = activationDetector.detectActivation(textToAnalyze);

      if (activation.isActivated) {
        if (activation.extractedCommand) {
          // MODE A: Wake word + command in single sentence (e.g. "Hey SOL, open Chrome")
          if (payload.isFinal) {
            console.log('[VoiceEngine] Mode A (One-Sentence Wake + Command):', activation.extractedCommand);
            this._setLifecycle('PROCESSING');
            solStore.setSolState('THINKING', true, 'Wake-word activation confirmed with command');

            this._commandCallbacks.forEach((cb) => {
              try { cb(activation); } catch (err) { console.error('[VoiceEngine] Command callback error:', err); }
            });
          } else {
            solStore.setSolState('UNDERSTANDING', true, 'Voice speech detected');
            this._setLifecycle('UNDERSTANDING');
          }
        } else {
          // MODE B: Wake word spoken alone (e.g. "Hey SOL")
          // Enter two-stage listening: wait for the command without requiring wake word again!
          console.log('[VoiceEngine] Mode B Stage 1: SOL Activated. Awaiting command...');
          this._stage = 'ACTIVATED_AWAITING_COMMAND';
          this._setLifecycle('SOL ACTIVATED' as any);
          solStore.setSolState('LISTENING', true, 'SOL activated — listening for command');

          this._clearStageTimeout();
          // 8-second window for user to speak their command
          this._stageTimeout = setTimeout(() => {
            if (this._stage === 'ACTIVATED_AWAITING_COMMAND') {
              console.log('[VoiceEngine] Two-stage listening window expired. Returning to passive.');
              this._stage = 'PASSIVE';
              this._setLifecycle('PASSIVE_LISTENING');
              solStore.setSolState('IDLE', true, 'Command window timed out');
            }
          }, 8000);
        }
      }
      return;
    }

    // STAGE 2: ACTIVATED & AWAITING COMMAND (User speaks the command directly)
    if (this._stage === 'ACTIVATED_AWAITING_COMMAND') {
      solStore.setSolState('UNDERSTANDING', true, 'Voice speech detected');
      this._setLifecycle('LISTENING_FOR_COMMAND');

      if (payload.isFinal) {
        this._clearStageTimeout();
        this._stage = 'PASSIVE';

        // Strip leading "sol" if user happened to repeat it
        let cleanCommand = textToAnalyze.replace(/^\s*\bsol\b[\s,.:;\-]*/i, '').trim();
        cleanCommand = cleanCommand.replace(/^(please|can you|could you)\s+/i, '').trim();

        console.log('[VoiceEngine] Mode B Stage 2: Captured command payload:', cleanCommand);

        if (cleanCommand) {
          this._setLifecycle('PROCESSING');
          solStore.setSolState('THINKING', true, `Executing command: "${cleanCommand}"`);

          const result: VoiceActivationResult = {
            isActivated: true,
            activationWord: 'SOL',
            extractedCommand: cleanCommand,
            rawTranscript: textToAnalyze,
          };

          this._commandCallbacks.forEach((cb) => {
            try { cb(result); } catch (err) { console.error('[VoiceEngine] Command callback error:', err); }
          });
        } else {
          this._setLifecycle('PASSIVE_LISTENING');
          solStore.setSolState('IDLE', true, 'Empty command received');
        }
      }
    }
  }
}

export const voiceEngine = new VoiceEngine();
