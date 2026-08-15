import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketMessage, WebSocketEventType } from '@mailflow/shared-types';

export class WebSocketGateway {
  private static instance: WebSocketGateway;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  private constructor() {}

  public static getInstance(): WebSocketGateway {
    if (!WebSocketGateway.instance) {
      WebSocketGateway.instance = new WebSocketGateway();
    }
    return WebSocketGateway.instance;
  }

  public initialize(wss: WebSocketServer): void {
    this.wss = wss;

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      // Send initial welcome message
      this.sendToClient(ws, {
        type: 'INITIAL_STATE',
        payload: { message: 'Connected to MailFlow Real-Time Telemetry Gateway' },
        timestamp: new Date().toISOString()
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', (err) => {
        console.error('WebSocket client error:', err);
        this.clients.delete(ws);
      });
    });

    console.log('[WebSocketGateway] Real-time WebSocket server initialized.');
  }

  public broadcast<T = any>(type: WebSocketEventType, payload: T): void {
    const message: WebSocketMessage<T> = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    const serialized = JSON.stringify(message);

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(serialized);
        } catch (err) {
          console.error('[WebSocketGateway] Broadcast error to client:', err);
        }
      }
    }
  }

  public sendToClient<T = any>(ws: WebSocket, message: WebSocketMessage<T>): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}
