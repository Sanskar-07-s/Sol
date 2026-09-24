/* ==========================================================================
   SOL HAND GESTURE INTEGRATION CONTRACT
   Extensible architecture ready to bind to MediaPipe or a native vision daemon.
   Exposes deterministic gesture events and continuous spatial control parameters
   (expansion, contraction, rotation, energy intensity).
   Status: PREPARED FOR HARDWARE VISION DAEMON (never faking synthetic hand detections).
   ========================================================================== */

export type SolGestureEventType =
  | 'HAND_DETECTED'
  | 'HAND_LOST'
  | 'OPEN_PALM'
  | 'CLOSED_FIST'
  | 'PINCH'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'MOVE_TOWARD'
  | 'MOVE_AWAY';

export interface GestureSpatialData {
  handPresent: boolean;
  palmX: number;              // -1.0 to 1.0
  palmY: number;              // -1.0 to 1.0
  depthZ: number;             // Distance from camera (normalized)
  expansionFactor: number;    // Open palm drives core opening
  rotationDeltaY: number;     // Swipes drive angular acceleration
  energyBoost: number;        // Fist / pinch drives energy concentration
}

export type GestureListener = (event: SolGestureEventType, data?: Partial<GestureSpatialData>) => void;

class SolGestureService {
  private _listeners: Set<GestureListener> = new Set();
  private _isHardwareActive = false;
  private _spatialData: GestureSpatialData = {
    handPresent: false,
    palmX: 0,
    palmY: 0,
    depthZ: 1.0,
    expansionFactor: 1.0,
    rotationDeltaY: 0,
    energyBoost: 0,
  };

  public get isHardwareActive(): boolean {
    return this._isHardwareActive;
  }

  public get spatialData(): Readonly<GestureSpatialData> {
    return this._spatialData;
  }

  public subscribe(listener: GestureListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Hardware bridge injection point for future MediaPipe / Vision Daemon.
   */
  public dispatchHardwareGesture(event: SolGestureEventType, data?: Partial<GestureSpatialData>): void {
    if (event === 'HAND_DETECTED') {
      this._spatialData.handPresent = true;
    } else if (event === 'HAND_LOST') {
      this._spatialData.handPresent = false;
    }

    if (data) {
      Object.assign(this._spatialData, data);
    }

    this._listeners.forEach((listener) => {
      try {
        listener(event, data);
      } catch (err) {
        console.error('[SOL Gesture Service] Dispatch error:', err);
      }
    });
  }

  /**
   * Cleanly initialize hardware pipeline hook.
   */
  public initializeHardwareVision(): Promise<boolean> {
    // Architectural hook for future MediaPipe camera integration.
    // Explicitly flags hardware as not yet active in standalone mode.
    this._isHardwareActive = false;
    return Promise.resolve(false);
  }
}

export const gestureService = new SolGestureService();
