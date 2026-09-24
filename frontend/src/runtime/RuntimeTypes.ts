/* ==========================================================================
   SOL RUNTIME & WEBSOCKET PROTOCOL TYPES
   Strongly-typed contracts between the frontend operating environment
   and the Python FastAPI backend daemon.
   ========================================================================== */

export type RuntimeConnectionStatus =
  | 'CONNECTED'
  | 'CONNECTING'
  | 'DISCONNECTED'
  | 'RECONNECTING'
  | 'ERROR';

export type CommandExecutionStatus =
  | 'received'
  | 'processing'
  | 'executing'
  | 'completed'
  | 'unsupported'
  | 'failed';

export interface CommandStepProgress {
  stepId: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/**
 * Outbound WebSocket Frames (Frontend -> Python Backend)
 */
export type OutboundRuntimeFrame =
  | {
      type: 'COMMAND_SUBMIT';
      commandId: string;
      text: string;
      source: 'text' | 'voice';
      timestamp: number;
    }
  | {
      type: 'CANCEL_TASK';
      taskId: string;
    }
  | {
      type: 'HEARTBEAT';
      timestamp: number;
    };

/**
 * Inbound WebSocket Frames (Python Backend -> Frontend)
 */
export type InboundRuntimeFrame =
  | {
      type: 'COMMAND_ACCEPTED';
      commandId: string;
      timestamp: number;
    }
  | {
      type: 'COMMAND_PROGRESS';
      commandId: string;
      agentName: string;
      currentStepIndex: number;
      steps: CommandStepProgress[];
      timestamp: number;
    }
  | {
      type: 'COMMAND_RESULT';
      commandId: string;
      status: CommandExecutionStatus;
      message: string;
      data?: Record<string, unknown>;
      timestamp: number;
    }
  | {
      type: 'COMMAND_ERROR';
      commandId: string;
      errorCode: string;
      message: string;
      timestamp: number;
    }
  | {
      type: 'STATE_CHANGE';
      state: string;
      reason?: string;
      timestamp: number;
    }
  | {
      type: 'TELEMETRY_UPDATE';
      cpuUsagePct: number;
      memoryUsagePct: number;
      memoryUsedGb: number;
      memoryTotalGb: number;
      gpuUsagePct?: number;
      gpuVramUsedGb?: number;
      networkLatencyMs: number;
      uptimeSeconds: number;
      isReal: boolean;
      timestamp: number;
    };

export type RuntimeFrameHandler = (frame: InboundRuntimeFrame) => void;
export type ConnectionStatusHandler = (status: RuntimeConnectionStatus) => void;
