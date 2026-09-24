import { useSyncExternalStore } from 'react';
import { SolStateMachine } from './solStateMachine';
import {
  AudioInputState,
  ContextualMessage,
  RuntimeConnectionState,
  SolCommand,
  SolState,
  TaskProgress,
  TelemetrySnapshot,
} from './types';
import { audioReactiveService } from '../core/audio/AudioReactiveService';
import { commandRuntime } from '../runtime/CommandRuntime';

/* ==========================================================================
   SOL STORE
   Lightweight, framework-native reactive store built with useSyncExternalStore.
   Zero external state management libraries needed.
   ========================================================================== */

interface SolStoreState {
  solState: SolState;
  stateMachine: SolStateMachine;
  connectionState: RuntimeConnectionState;
  currentCommand: SolCommand | null;
  activeTask: TaskProgress | null;
  contextualMessage: ContextualMessage | null;
  telemetry: TelemetrySnapshot;
  audioState: AudioInputState;
  fpsMetric: number;
}

const initialStateMachine = new SolStateMachine('IDLE');

let storeState: SolStoreState = {
  solState: 'IDLE',
  stateMachine: initialStateMachine,
  connectionState: 'DISCONNECTED',
  currentCommand: null,
  activeTask: null,
  contextualMessage: null,
  telemetry: {
    cpuUsagePct: 0,
    memoryUsagePct: 0,
    memoryUsedGb: 0,
    memoryTotalGb: 16.0,
    gpuUsagePct: 0,
    gpuVramUsedGb: 0,
    networkLatencyMs: 4,
    isSimulatedDevData: false,
    timestamp: Date.now(),
  },
  audioState: {
    isListening: false,
    hasPermission: false,
    amplitude: 0,
  },
  fpsMetric: 60,
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

// Hook state machine changes directly into store updates
initialStateMachine.subscribe((event) => {
  storeState = {
    ...storeState,
    solState: event.to,
  };
  emitChange();
});

export const solStore = {
  getState: (): SolStoreState => storeState,

  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setSolState: (state: SolState, force = false, reason?: string): boolean => {
    return storeState.stateMachine.transition(state, force, reason);
  },

  setConnectionState: (connectionState: RuntimeConnectionState) => {
    storeState = { ...storeState, connectionState };
    emitChange();
  },

  setContextualMessage: (contextualMessage: ContextualMessage | null) => {
    storeState = { ...storeState, contextualMessage };
    emitChange();
  },

  setActiveTask: (activeTask: TaskProgress | null) => {
    storeState = { ...storeState, activeTask };
    emitChange();
  },

  updateTelemetry: (telemetry: TelemetrySnapshot) => {
    storeState = { ...storeState, telemetry };
    emitChange();
  },

  submitCommand: (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Dispatch command through real CommandRuntime pipeline (no fake timers!)
    commandRuntime.dispatchCommand(trimmed, 'text');
  },

  clearActiveTask: () => {
    storeState = { ...storeState, activeTask: null };
    emitChange();
  },

  clearContextualMessage: () => {
    storeState = { ...storeState, contextualMessage: null };
    emitChange();
  },

  toggleAudioListening: async () => {
    const nextListening = !storeState.audioState.isListening;

    if (nextListening) {
      storeState.stateMachine.transition('LISTENING', true, 'Voice activation requested');
      const granted = await audioReactiveService.startListening();
      storeState = {
        ...storeState,
        audioState: {
          ...storeState.audioState,
          isListening: granted,
          hasPermission: granted,
          error: audioReactiveService.errorMessage ?? undefined,
        },
      };
      emitChange();
      if (!granted) {
        // Fall back gracefully to IDLE if microphone permission was not granted
        storeState.stateMachine.transition('IDLE', true, 'Microphone unavailable');
      }
    } else {
      audioReactiveService.stopListening();
      storeState = {
        ...storeState,
        audioState: {
          ...storeState.audioState,
          isListening: false,
        },
      };
      emitChange();
      storeState.stateMachine.transition('IDLE', true, 'Voice input stopped');
    }
  },

  updateFpsMetric: (fps: number) => {
    if (Math.abs(storeState.fpsMetric - fps) > 1) {
      storeState = { ...storeState, fpsMetric: fps };
      emitChange();
    }
  },
};

/**
 * Custom React Hook to consume the store
 */
export function useSolStore(): SolStoreState {
  return useSyncExternalStore(solStore.subscribe, solStore.getState);
}
