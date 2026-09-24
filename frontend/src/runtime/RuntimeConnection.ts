import {
  ConnectionStatusHandler,
  InboundRuntimeFrame,
  OutboundRuntimeFrame,
  RuntimeConnectionStatus,
  RuntimeFrameHandler,
} from './RuntimeTypes';

export class RuntimeConnection {
  private _ws: WebSocket | null = null;
  private _status: RuntimeConnectionStatus = 'DISCONNECTED';
  private _endpointUrl = 'ws://127.0.0.1:8000/ws/runtime';

  private _frameHandlers: Set<RuntimeFrameHandler> = new Set();
  private _statusHandlers: Set<ConnectionStatusHandler> = new Set();

  private _reconnectAttempts = 0;
  private _maxReconnectDelayMs = 15000;
  private _reconnectTimerId: number | null = null;
  private _shouldReconnect = true;

  constructor(endpointUrl = 'ws://127.0.0.1:8000/ws/runtime') {
    this._endpointUrl = endpointUrl;
  }

  public get status(): RuntimeConnectionStatus {
    return this._status;
  }

  public connect(): void {
    if (this._ws && (this._ws.readyState === WebSocket.CONNECTING || this._ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this._shouldReconnect = true;
    this._setStatus(this._reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');

    try {
      this._ws = new WebSocket(this._endpointUrl);

      this._ws.onopen = () => {
        this._reconnectAttempts = 0;
        this._setStatus('CONNECTED');
        if (this._reconnectTimerId !== null) {
          window.clearTimeout(this._reconnectTimerId);
          this._reconnectTimerId = null;
        }
      };

      this._ws.onmessage = (event: MessageEvent) => {
        try {
          const frame = JSON.parse(event.data) as InboundRuntimeFrame;
          this._notifyFrameHandlers(frame);
        } catch (err) {
          console.error('[RuntimeConnection] Invalid JSON frame received:', err, event.data);
        }
      };

      this._ws.onerror = (err) => {
        console.warn('[RuntimeConnection] WebSocket error:', err);
        this._setStatus('ERROR');
      };

      this._ws.onclose = () => {
        this._ws = null;
        this._setStatus('DISCONNECTED');

        if (this._shouldReconnect) {
          this._scheduleReconnect();
        }
      };
    } catch (err) {
      console.warn('[RuntimeConnection] WebSocket creation error:', err);
      this._setStatus('ERROR');
      if (this._shouldReconnect) {
        this._scheduleReconnect();
      }
    }
  }

  public disconnect(): void {
    this._shouldReconnect = false;
    if (this._reconnectTimerId !== null) {
      window.clearTimeout(this._reconnectTimerId);
      this._reconnectTimerId = null;
    }
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    this._setStatus('DISCONNECTED');
  }

  public send(frame: OutboundRuntimeFrame): boolean {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(frame));
      return true;
    }
    return false;
  }

  public onMessage(handler: RuntimeFrameHandler): () => void {
    this._frameHandlers.add(handler);
    return () => this._frameHandlers.delete(handler);
  }

  public onStatusChange(handler: ConnectionStatusHandler): () => void {
    this._statusHandlers.add(handler);
    return () => this._statusHandlers.delete(handler);
  }

  private _scheduleReconnect(): void {
    if (this._reconnectTimerId !== null) return;

    this._reconnectAttempts++;
    // Exponential backoff: 1s, 2s, 4s, 8s, max 15s
    const delay = Math.min(
      1000 * Math.pow(2, this._reconnectAttempts - 1),
      this._maxReconnectDelayMs
    );

    this._reconnectTimerId = window.setTimeout(() => {
      this._reconnectTimerId = null;
      this.connect();
    }, delay);
  }

  private _setStatus(nextStatus: RuntimeConnectionStatus): void {
    if (this._status !== nextStatus) {
      this._status = nextStatus;
      this._statusHandlers.forEach((handler) => {
        try { handler(nextStatus); } catch (err) { console.error('[RuntimeConnection] Status handler error:', err); }
      });
    }
  }

  private _notifyFrameHandlers(frame: InboundRuntimeFrame): void {
    this._frameHandlers.forEach((handler) => {
      try { handler(frame); } catch (err) { console.error('[RuntimeConnection] Frame handler error:', err); }
    });
  }
}

export const runtimeConnection = new RuntimeConnection();
