/* ==========================================================================
   SOL TELEMETRY SERVICE
   System-awareness telemetry abstraction.
   Provides clearly flagged development data during Phase 1 standalone mode.
   Prepared to bind directly to a WebSocket/IPC hardware daemon stream.
   ========================================================================== */

import { TelemetrySnapshot } from '../state/types';

export type TelemetryUpdateCallback = (snapshot: TelemetrySnapshot) => void;

class SolTelemetryService {
  private _intervalId: number | null = null;
  private _callbacks: Set<TelemetryUpdateCallback> = new Set();
  private _isLiveDaemon = false;

  public startPolling(intervalMs = 3000): void {
    if (this._intervalId !== null) return;

    this._intervalId = window.setInterval(() => {
      if (!this._isLiveDaemon) {
        // Subtle drift in dev telemetry values to show responsiveness without claiming live status
        const cpuDrift = Math.round(15 + Math.sin(Date.now() / 4000) * 8);
        const memDrift = 42 + Number((Math.sin(Date.now() / 9000) * 1.5).toFixed(1));

        const snapshot: TelemetrySnapshot = {
          cpuUsagePct: cpuDrift,
          memoryUsagePct: memDrift,
          memoryUsedGb: Number(((memDrift / 100) * 16).toFixed(1)),
          memoryTotalGb: 16.0,
          gpuUsagePct: 12 + Math.round(Math.cos(Date.now() / 5000) * 5),
          gpuVramUsedGb: 1.8,
          networkLatencyMs: 12 + Math.round(Math.random() * 4),
          isSimulatedDevData: true,
          timestamp: Date.now(),
        };

        this._notify(snapshot);
      }
    }, intervalMs);
  }

  public stopPolling(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  public subscribe(cb: TelemetryUpdateCallback): () => void {
    this._callbacks.add(cb);
    return () => this._callbacks.delete(cb);
  }

  private _notify(snapshot: TelemetrySnapshot): void {
    this._callbacks.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (err) {
        console.error('[SOL Telemetry] Callback failure:', err);
      }
    });
  }
}

export const telemetryService = new SolTelemetryService();
