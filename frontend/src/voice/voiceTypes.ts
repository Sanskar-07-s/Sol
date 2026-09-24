/* ==========================================================================
   SOL VOICE TYPES & CONTRACTS
   Provider-agnostic specifications for speech recognition, speech synthesis,
   microphone permission handling, and wake-word activation.
   ========================================================================== */

export type MicPermissionState =
  | 'UNAVAILABLE'
  | 'REQUESTING'
  | 'DENIED'
  | 'AVAILABLE'
  | 'LISTENING';

export type VoiceActivationMode = 'PUSH_TO_TALK' | 'VOICE_ACTIVATION';

export interface SpeechRecognitionResultPayload {
  transcript: string;
  interimTranscript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechSynthesisConfig {
  voice?: SpeechSynthesisVoice | null;
  rate: number;   // 0.5 to 2.0 (default 1.0)
  pitch: number;  // 0.5 to 1.5 (default 1.0)
  volume: number; // 0.0 to 1.0 (default 1.0)
}

export interface VoiceActivationResult {
  isActivated: boolean;
  activationWord?: string;
  extractedCommand?: string;
  rawTranscript: string;
}

export type SpeechRecognitionCallback = (payload: SpeechRecognitionResultPayload) => void;
export type SpeechRecognitionErrorCallback = (error: string) => void;
export type SpeechSynthesisStateCallback = (isSpeaking: boolean) => void;

/**
 * Provider interface for Speech Recognition (Web Speech API or local Windows engine)
 */
export interface ISpeechRecognitionProvider {
  isSupported(): boolean;
  start(): Promise<boolean>;
  stop(): void;
  isListening(): boolean;
  getTranscript(): string;
  getInterimTranscript(): string;
  getConfidence(): number;
  onResult(cb: SpeechRecognitionCallback): () => void;
  onError(cb: SpeechRecognitionErrorCallback): () => void;
  onEnd(cb: () => void): () => void;
}

/**
 * Provider interface for Speech Synthesis (TTS)
 */
export interface ISpeechSynthesisProvider {
  isSupported(): boolean;
  speak(text: string, config?: Partial<SpeechSynthesisConfig>): Promise<boolean>;
  stop(): void;
  pause(): void;
  resume(): void;
  isSpeaking(): boolean;
  getVoices(): SpeechSynthesisVoice[];
  onStateChange(cb: SpeechSynthesisStateCallback): () => void;
}
