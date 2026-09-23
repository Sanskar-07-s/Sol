/* ==========================================================================
   SOL RUNTIME / BACKEND CONTRACT
   Strongly-typed interface specifications for communication between the
   frontend operating environment and the future runtime services (Python/C++ daemon).
   Designed to work over WebSocket, IPC (Tauri/Electron), or direct gRPC.
   ========================================================================== */

import {
  AudioInputState,
  ContextualMessage,
  RuntimeConnectionState,
  SolCommand,
  SolState,
  TaskProgress,
  TelemetrySnapshot,
} from '../state/types';

/**
 * Inbound messages: from SOL Runtime Daemon to Frontend
 */
export type RuntimeInboundMessage =
  | {
      type: 'STATE_CHANGE';
      payload: {
        state: SolState;
        reason?: string;
        timestamp: number;
      };
    }
  | {
      type: 'TELEMETRY_UPDATE';
      payload: TelemetrySnapshot;
    }
  | {
      type: 'TASK_PROGRESS';
      payload: TaskProgress;
    }
  | {
      type: 'CONTEXTUAL_MESSAGE';
      payload: ContextualMessage;
    }
  | {
      type: 'AUDIO_STATE';
      payload: AudioInputState;
    }
  | {
      type: 'CONNECTION_STATE';
      payload: {
        status: RuntimeConnectionState;
        endpoint?: string;
        version?: string;
      };
    }
  | {
      type: 'ERROR_EVENT';
      payload: {
        code: string;
        message: string;
        recoverable: boolean;
      };
    };

/**
 * Outbound messages: from Frontend Operating Environment to SOL Runtime Daemon
 */
export type RuntimeOutboundMessage =
  | {
      type: 'SUBMIT_COMMAND';
      payload: SolCommand;
    }
  | {
      type: 'CANCEL_TASK';
      payload: {
        taskId: string;
      };
    }
  | {
      type: 'REQUEST_STATE_CHANGE';
      payload: {
        targetState: SolState;
        force?: boolean;
      };
    }
  | {
      type: 'SET_AUDIO_LISTENING';
      payload: {
        enabled: boolean;
      };
    }
  | {
      type: 'HEARTBEAT';
      payload: {
        clientTimestamp: number;
      };
    };

/**
 * Transport-agnostic bridge contract interface.
 */
export interface ISolRuntimeClient {
  connect(endpointUrl?: string): Promise<void>;
  disconnect(): void;
  send(message: RuntimeOutboundMessage): void;
  onMessage(handler: (msg: RuntimeInboundMessage) => void): () => void;
  getConnectionState(): RuntimeConnectionState;
}
