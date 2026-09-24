import { runtimeConnection } from './RuntimeConnection';
import {
  InboundRuntimeFrame,
  OutboundRuntimeFrame,
} from './RuntimeTypes';
import { solStore } from '../state/useSolStore';
import { voiceEngine } from '../voice/VoiceEngine';

export class CommandRuntime {
  private _activeCommands: Map<string, string> = new Map();

  constructor() {
    this._initializeRuntime();
  }

  private _initializeRuntime(): void {
    // 1. Connect WebSocket status updates to store
    runtimeConnection.onStatusChange((status) => {
      if (status === 'CONNECTED') {
        solStore.setConnectionState('CONNECTED');
      } else if (status === 'CONNECTING' || status === 'RECONNECTING') {
        solStore.setConnectionState('CONNECTING');
      } else {
        solStore.setConnectionState('DISCONNECTED');
      }
    });

    // 2. Process inbound WebSocket frames from Python backend
    runtimeConnection.onMessage((frame: InboundRuntimeFrame) => {
      this._handleInboundFrame(frame);
    });

    // 3. Bind VoiceEngine recognized commands to central command pipeline
    voiceEngine.onCommandRecognized((result) => {
      if (result.extractedCommand) {
        this.dispatchCommand(result.extractedCommand, 'voice');
      }
    });
  }

  /**
   * Submit an operational command (via text input or voice) through the real runtime boundary.
   */
  public dispatchCommand(text: string, source: 'text' | 'voice' = 'text'): string {
    const trimmed = text.trim();
    if (!trimmed) return '';

    const commandId = `cmd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this._activeCommands.set(commandId, trimmed);

    // Update state machine: Intake -> UNDERSTANDING
    solStore.setSolState('UNDERSTANDING', true, `Dispatching command: "${trimmed}"`);

    // Prepare outbound frame
    const frame: OutboundRuntimeFrame = {
      type: 'COMMAND_SUBMIT',
      commandId,
      text: trimmed,
      source,
      timestamp: Date.now(),
    };

    const isSent = runtimeConnection.send(frame);

    if (!isSent) {
      // Backend is offline / disconnected — report honest failure without fake task completion
      console.warn('[CommandRuntime] Runtime daemon unavailable. Command cannot be executed.');
      
      solStore.setSolState('ERROR', true, 'Backend runtime daemon disconnected');

      solStore.setContextualMessage({
        id: `msg-${Date.now()}`,
        sender: 'system',
        content: `RUNTIME OFFLINE // Could not process command "${trimmed}". Start Python backend daemon.`,
        timestamp: Date.now(),
      });

      solStore.setActiveTask({
        id: commandId,
        title: trimmed,
        agentName: 'SYSTEM DAEMON',
        currentStepIndex: 0,
        status: 'failed',
        startedAt: Date.now(),
        completedAt: Date.now(),
        steps: [
          { id: '1', label: 'Connecting to SOL Python Runtime', status: 'failed' },
          { id: '2', label: 'Dispatching payload frame', status: 'pending' },
        ],
      });

      // Voice warning output if enabled
      voiceEngine.speak(`Runtime daemon is offline. Could not execute ${trimmed}`);

      setTimeout(() => {
        solStore.setSolState('IDLE', true, 'Failsafe reset');
      }, 4000);

      return commandId;
    }

    // Command sent successfully to WebSocket
    solStore.setContextualMessage({
      id: `msg-${Date.now()}`,
      sender: 'sol',
      content: `Dispatched to runtime: "${trimmed}". Processing...`,
      timestamp: Date.now(),
    });

    solStore.setActiveTask({
      id: commandId,
      title: trimmed,
      agentName: 'SOL RUNTIME',
      currentStepIndex: 0,
      status: 'active',
      startedAt: Date.now(),
      steps: [
        { id: '1', label: 'Connecting to SOL Python Runtime', status: 'completed' },
        { id: '2', label: 'Dispatching operational frame', status: 'in_progress' },
      ],
    });

    return commandId;
  }

  private _handleInboundFrame(frame: InboundRuntimeFrame): void {
    switch (frame.type) {
      case 'COMMAND_ACCEPTED': {
        solStore.setSolState('THINKING', true, 'Command accepted by backend');
        const active = solStore.getState().activeTask;
        if (active && active.id === frame.commandId) {
          solStore.setActiveTask({
            ...active,
            currentStepIndex: 1,
            steps: [
              { id: '1', label: 'Connecting to SOL Python Runtime', status: 'completed' },
              { id: '2', label: 'Frame accepted by daemon', status: 'completed' },
              { id: '3', label: 'Executing capability pipeline', status: 'in_progress' },
            ],
          });
        }
        break;
      }

      case 'COMMAND_PROGRESS': {
        solStore.setSolState('EXECUTING', true, 'Command progress update');
        const active = solStore.getState().activeTask;
        if (active && active.id === frame.commandId) {
          solStore.setActiveTask({
            ...active,
            agentName: frame.agentName.toUpperCase(),
            currentStepIndex: frame.currentStepIndex,
            steps: frame.steps.map((s) => ({
              id: s.stepId,
              label: s.label,
              status: s.status,
            })),
          });
        }
        break;
      }

      case 'COMMAND_RESULT': {
        this._handleCommandResult(frame.commandId, frame.status, frame.message);
        break;
      }

      case 'COMMAND_ERROR': {
        this._handleCommandResult(frame.commandId, 'failed', frame.message);
        break;
      }

      case 'TELEMETRY_UPDATE': {
        solStore.updateTelemetry({
          cpuUsagePct: frame.cpuUsagePct,
          memoryUsagePct: frame.memoryUsagePct,
          memoryUsedGb: frame.memoryUsedGb,
          memoryTotalGb: frame.memoryTotalGb,
          gpuUsagePct: frame.gpuUsagePct,
          gpuVramUsedGb: frame.gpuVramUsedGb,
          networkLatencyMs: frame.networkLatencyMs,
          isSimulatedDevData: !frame.isReal,
          timestamp: frame.timestamp,
        });
        break;
      }

      case 'STATE_CHANGE': {
        solStore.setSolState(frame.state as any, true, frame.reason);
        break;
      }
    }
  }

  private _handleCommandResult(commandId: string, status: string, message: string): void {
    const rawText = this._activeCommands.get(commandId) || 'Command';
    this._activeCommands.delete(commandId);

    console.log(`[CommandRuntime] Result for "${rawText}" (${commandId}): ${status} - ${message}`);

    if (status === 'completed') {
      solStore.setSolState('SUCCESS', true, 'Command execution completed');

      solStore.setContextualMessage({
        id: `msg-${Date.now()}`,
        sender: 'sol',
        content: message,
        timestamp: Date.now(),
      });

      const active = solStore.getState().activeTask;
      if (active && active.id === commandId) {
        solStore.setActiveTask({
          ...active,
          status: 'completed',
          completedAt: Date.now(),
          steps: active.steps.map((s) => ({ ...s, status: 'completed' as const })),
        });
      }

      // Speak response via TTS
      voiceEngine.speak(message);

    } else if (status === 'unsupported') {
      solStore.setSolState('WARNING', true, 'Command capability unsupported');

      solStore.setContextualMessage({
        id: `msg-${Date.now()}`,
        sender: 'sol',
        content: `CAPABILITY UNSUPPORTED // ${message}`,
        timestamp: Date.now(),
      });

      const active = solStore.getState().activeTask;
      if (active && active.id === commandId) {
        solStore.setActiveTask({
          ...active,
          status: 'failed',
          completedAt: Date.now(),
          steps: [
            { id: '1', label: 'Connecting to SOL Python Runtime', status: 'completed' },
            { id: '2', label: 'Checking capability executor', status: 'failed' },
            { id: '3', label: message, status: 'failed' },
          ],
        });
      }

      voiceEngine.speak(message);

      setTimeout(() => {
        solStore.setSolState('IDLE', true, 'Reset from unsupported warning');
      }, 4500);

    } else {
      // Failed / Error
      solStore.setSolState('ERROR', true, 'Command execution failed');

      solStore.setContextualMessage({
        id: `msg-${Date.now()}`,
        sender: 'sol',
        content: `EXECUTION FAILURE // ${message}`,
        timestamp: Date.now(),
      });

      const active = solStore.getState().activeTask;
      if (active && active.id === commandId) {
        solStore.setActiveTask({
          ...active,
          status: 'failed',
          completedAt: Date.now(),
          steps: active.steps.map((s) => ({ ...s, status: 'failed' as const })),
        });
      }

      voiceEngine.speak(`Command failed: ${message}`);

      setTimeout(() => {
        solStore.setSolState('IDLE', true, 'Reset from error state');
      }, 4500);
    }
  }
}

export const commandRuntime = new CommandRuntime();
