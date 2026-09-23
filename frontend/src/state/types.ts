/* ==========================================================================
   SOL STATE SYSTEM TYPES
   Foundational types for operating environment, state machine, and telemetry
   ========================================================================== */

export type SolState =
  | 'STANDBY'
  | 'IDLE'
  | 'LISTENING'
  | 'UNDERSTANDING'
  | 'THINKING'
  | 'PLANNING'
  | 'EXECUTING'
  | 'SPEAKING'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'OFFLINE';

export type RuntimeConnectionState =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'ERROR'
  | 'STANDALONE_DEV';

export interface TaskStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface TaskProgress {
  id: string;
  title: string;
  agentName: string; // e.g., 'SYSTEM AGENT', 'BROWSER AGENT'
  currentStepIndex: number;
  steps: TaskStep[];
  status: 'active' | 'completed' | 'failed';
  startedAt: number;
  completedAt?: number;
}

export interface ContextualMessage {
  id: string;
  sender: 'user' | 'sol' | 'system';
  content: string;
  timestamp: number;
  transient?: boolean; // If true, auto-fades after duration
}

export interface TelemetrySnapshot {
  cpuUsagePct: number;
  memoryUsagePct: number;
  memoryUsedGb: number;
  memoryTotalGb: number;
  gpuUsagePct?: number;
  gpuVramUsedGb?: number;
  networkLatencyMs: number;
  isSimulatedDevData: boolean;
  timestamp: number;
}

export interface SolCommand {
  id: string;
  rawText: string;
  timestamp: number;
  status: 'submitted' | 'processing' | 'completed' | 'failed';
}

export interface AudioInputState {
  isListening: boolean;
  hasPermission: boolean;
  amplitude: number; // 0.0 to 1.0 (for future reactive core)
  error?: string;
}

export interface StateTransitionEvent {
  from: SolState;
  to: SolState;
  timestamp: number;
  reason?: string;
}

export type StateListener = (event: StateTransitionEvent) => void;
