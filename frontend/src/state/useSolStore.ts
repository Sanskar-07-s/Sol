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
  connectionState: 'STANDALONE_DEV',
  currentCommand: null,
  activeTask: null,
  contextualMessage: null,
  telemetry: {
    cpuUsagePct: 18,
    memoryUsagePct: 42,
    memoryUsedGb: 6.7,
    memoryTotalGb: 16.0,
    gpuUsagePct: 14,
    gpuVramUsedGb: 1.8,
    networkLatencyMs: 12,
    isSimulatedDevData: true,
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

  submitCommand: (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const command: SolCommand = {
      id: `cmd-${Date.now()}`,
      rawText: trimmed,
      timestamp: Date.now(),
      status: 'submitted',
    };

    storeState = {
      ...storeState,
      currentCommand: command,
    };
    emitChange();

    // Trigger state change reflecting command intake
    storeState.stateMachine.transition('UNDERSTANDING', true, `Received command: "${trimmed}"`);

    // In standalone development mode, show contextual acknowledgement and simulate a clean task preview
    storeState = {
      ...storeState,
      contextualMessage: {
        id: `msg-${Date.now()}`,
        sender: 'sol',
        content: `Acknowledged: "${trimmed}". Processing through runtime pipeline...`,
        timestamp: Date.now(),
      },
      activeTask: {
        id: `task-${Date.now()}`,
        title: trimmed,
        agentName: 'SYSTEM PIPELINE',
        currentStepIndex: 0,
        status: 'active',
        startedAt: Date.now(),
        steps: [
          { id: '1', label: 'Parsing operational command', status: 'in_progress' },
          { id: '2', label: 'Checking backend daemon availability', status: 'pending' },
          { id: '3', label: 'Dispatching execution payload', status: 'pending' },
        ],
      },
    };
    emitChange();

    // Simulate progressive execution steps in development mode
    setTimeout(() => {
      storeState.stateMachine.transition('EXECUTING', true, 'Simulating task progress');
      if (storeState.activeTask) {
        storeState = {
          ...storeState,
          activeTask: {
            ...storeState.activeTask,
            currentStepIndex: 1,
            steps: [
              { id: '1', label: 'Parsing operational command', status: 'completed' },
              { id: '2', label: 'Checking backend daemon availability', status: 'in_progress' },
              { id: '3', label: 'Dispatching execution payload', status: 'pending' },
            ],
          },
        };
        emitChange();
      }
    }, 1200);

    setTimeout(() => {
      storeState.stateMachine.transition('SUCCESS', true, 'Task completed');
      if (storeState.activeTask) {
        storeState = {
          ...storeState,
          activeTask: {
            ...storeState.activeTask,
            currentStepIndex: 2,
            status: 'completed',
            completedAt: Date.now(),
            steps: [
              { id: '1', label: 'Parsing operational command', status: 'completed' },
              { id: '2', label: 'Checking backend daemon availability', status: 'completed' },
              { id: '3', label: 'Standalone development pipeline ready', status: 'completed' },
            ],
          },
        };
        emitChange();
      }
    }, 2800);

    // Return to IDLE after success
    setTimeout(() => {
      storeState.stateMachine.transition('IDLE', true, 'Reset to idle state');
    }, 4500);
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
