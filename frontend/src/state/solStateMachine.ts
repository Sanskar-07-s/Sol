import { SolState, StateListener, StateTransitionEvent } from './types';

/* ==========================================================================
   SOL STATE MACHINE
   Deterministic transition manager with validation and observer callbacks.
   Decoupled from rendering logic: the WebGL renderer observes state changes.
   ========================================================================== */

export const ALL_SOL_STATES: readonly SolState[] = [
  'STANDBY',
  'IDLE',
  'LISTENING',
  'UNDERSTANDING',
  'THINKING',
  'PLANNING',
  'EXECUTING',
  'SPEAKING',
  'SUCCESS',
  'WARNING',
  'ERROR',
  'OFFLINE',
] as const;

/**
 * Validated transition matrix.
 * Defines which states can legitimately transition to which targets.
 * In emergency/fail-safe situations, WARNING, ERROR, and OFFLINE can always be reached.
 */
const VALID_TRANSITIONS: Record<SolState, readonly SolState[]> = {
  STANDBY: ['IDLE', 'LISTENING', 'OFFLINE', 'ERROR'],
  IDLE: ['STANDBY', 'LISTENING', 'THINKING', 'EXECUTING', 'WARNING', 'ERROR', 'OFFLINE'],
  LISTENING: ['IDLE', 'UNDERSTANDING', 'WARNING', 'ERROR', 'OFFLINE'],
  UNDERSTANDING: ['THINKING', 'PLANNING', 'SPEAKING', 'WARNING', 'ERROR', 'OFFLINE'],
  THINKING: ['PLANNING', 'EXECUTING', 'SPEAKING', 'IDLE', 'WARNING', 'ERROR', 'OFFLINE'],
  PLANNING: ['EXECUTING', 'THINKING', 'SPEAKING', 'WARNING', 'ERROR', 'OFFLINE'],
  EXECUTING: ['SUCCESS', 'WARNING', 'ERROR', 'SPEAKING', 'IDLE', 'OFFLINE'],
  SPEAKING: ['IDLE', 'LISTENING', 'THINKING', 'SUCCESS', 'WARNING', 'ERROR', 'OFFLINE'],
  SUCCESS: ['IDLE', 'STANDBY', 'SPEAKING', 'OFFLINE'],
  WARNING: ['IDLE', 'THINKING', 'EXECUTING', 'ERROR', 'OFFLINE'],
  ERROR: ['IDLE', 'STANDBY', 'OFFLINE'],
  OFFLINE: ['STANDBY', 'IDLE'],
};

export class SolStateMachine {
  private _currentState: SolState;
  private _lastTransitionTime: number;
  private _listeners: Set<StateListener> = new Set();
  private _history: StateTransitionEvent[] = [];
  private readonly _maxHistory: number = 50;

  constructor(initialState: SolState = 'IDLE') {
    this._currentState = initialState;
    this._lastTransitionTime = Date.now();
  }

  public get currentState(): SolState {
    return this._currentState;
  }

  public get lastTransitionTime(): number {
    return this._lastTransitionTime;
  }

  public get history(): readonly StateTransitionEvent[] {
    return this._history;
  }

  /**
   * Verify if a target state is a valid transition from current state.
   */
  public canTransitionTo(targetState: SolState): boolean {
    if (this._currentState === targetState) return true;
    const allowed = VALID_TRANSITIONS[this._currentState];
    return allowed ? allowed.includes(targetState) : false;
  }

  /**
   * Transition to a new state with validation and observer broadcast.
   * @param targetState Target state
   * @param force In development or emergency situations, bypass transition rules
   * @param reason Optional human or machine reason for transition
   */
  public transition(targetState: SolState, force = false, reason?: string): boolean {
    if (this._currentState === targetState) {
      return true; // No-op
    }

    if (!force && !this.canTransitionTo(targetState)) {
      console.warn(
        `[SOL State Machine] Invalid state transition rejected: ${this._currentState} -> ${targetState}`
      );
      return false;
    }

    const event: StateTransitionEvent = {
      from: this._currentState,
      to: targetState,
      timestamp: Date.now(),
      reason,
    };

    this._currentState = targetState;
    this._lastTransitionTime = event.timestamp;
    this._history.unshift(event);
    if (this._history.length > this._maxHistory) {
      this._history.pop();
    }

    this._notifyListeners(event);
    return true;
  }

  public subscribe(listener: StateListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private _notifyListeners(event: StateTransitionEvent): void {
    this._listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[SOL State Machine] Observer notification error:', err);
      }
    });
  }
}
