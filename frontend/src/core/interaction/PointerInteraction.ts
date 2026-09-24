/* ==========================================================================
   SOL POINTER INTERACTION
   Smooth inertial tracking for mouse and touch coordinates.
   Dampens normalized [-1, 1] screen coordinates to drive camera parallax,
   orbital perspective tilt, and particle deflection.
   ========================================================================== */

export interface PointerState {
  normalizedX: number; // Current smoothed X in [-1, 1]
  normalizedY: number; // Current smoothed Y in [-1, 1]
  targetX: number;     // Target X in [-1, 1]
  targetY: number;     // Target Y in [-1, 1]
  velocityX: number;   // Current pointer velocity
  velocityY: number;   // Current pointer velocity
  isHovering: boolean; // Pointer inside canvas area
}

export class PointerInteraction {
  private _state: PointerState = {
    normalizedX: 0,
    normalizedY: 0,
    targetX: 0,
    targetY: 0,
    velocityX: 0,
    velocityY: 0,
    isHovering: false,
  };

  private _domElement: HTMLElement | null = null;
  private _handlePointerMove: (e: PointerEvent) => void;
  private _handlePointerEnter: () => void;
  private _handlePointerLeave: () => void;

  constructor() {
    this._handlePointerMove = (e: PointerEvent) => {
      if (!this._domElement) return;
      const rect = this._domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      this._state.targetX = Math.max(-1, Math.min(1, x));
      this._state.targetY = Math.max(-1, Math.min(1, y));
      this._state.isHovering = true;
    };

    this._handlePointerEnter = () => {
      this._state.isHovering = true;
    };

    this._handlePointerLeave = () => {
      this._state.isHovering = false;
      this._state.targetX = 0;
      this._state.targetY = 0;
    };
  }

  public attach(domElement: HTMLElement): void {
    this._domElement = domElement;
    domElement.addEventListener('pointermove', this._handlePointerMove);
    domElement.addEventListener('pointerenter', this._handlePointerEnter);
    domElement.addEventListener('pointerleave', this._handlePointerLeave);
  }

  public detach(): void {
    if (this._domElement) {
      this._domElement.removeEventListener('pointermove', this._handlePointerMove);
      this._domElement.removeEventListener('pointerenter', this._handlePointerEnter);
      this._domElement.removeEventListener('pointerleave', this._handlePointerLeave);
      this._domElement = null;
    }
  }

  /**
   * Updates coordinates per frame with exponential spring dampening.
   */
  public update(delta: number): PointerState {
    const stiffness = 8.0;
    const factor = Math.min(1.0, delta * stiffness);

    const prevX = this._state.normalizedX;
    const prevY = this._state.normalizedY;

    this._state.normalizedX += (this._state.targetX - this._state.normalizedX) * factor;
    this._state.normalizedY += (this._state.targetY - this._state.normalizedY) * factor;

    this._state.velocityX = (this._state.normalizedX - prevX) / (delta || 0.016);
    this._state.velocityY = (this._state.normalizedY - prevY) / (delta || 0.016);

    return this._state;
  }

  public get state(): Readonly<PointerState> {
    return this._state;
  }
}
