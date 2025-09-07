import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';

interface AnalysisConnection {
  ws: WebSocket;
  analysisId: string;
}

export class WebSocketService {
  private wss: WSServer;
  private connections: Map<string, AnalysisConnection> = new Map();

  constructor(server: Server) {
    this.wss = new WSServer({ 
      server,
      path: '/analysis'
    });

    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers() {
    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const url = new URL(req.url, `ws://${req.headers.host}`);
      const analysisId = url.searchParams.get('analysisId');

      if (!analysisId) {
        ws.close(1008, 'Missing analysisId');
        return;
      }

      // Store the connection
      this.connections.set(analysisId, { ws, analysisId });

      // Set up ping/pong to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }, 30000); // Send ping every 30 seconds

      ws.on('close', () => {
        clearInterval(pingInterval);
        this.connections.delete(analysisId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for analysis ${analysisId}:`, error);
        this.connections.delete(analysisId);
      });

      ws.on('pong', () => {
        // Client is still alive
      });
    });
  }

  public sendEnhancedAnalysis(analysisId: string, data: any) {
    const connection = this.connections.get(analysisId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      try {
        connection.ws.send(JSON.stringify({
          type: 'enhanced_analysis',
          data,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error(`Error sending enhanced analysis for ${analysisId}:`, error);
        this.connections.delete(analysisId);
      }
    }
  }

  public generateAnalysisId(): string {
    return uuidv4();
  }

  public getActiveConnections(): number {
    return this.connections.size;
  }

  public closeConnection(analysisId: string): void {
    const connection = this.connections.get(analysisId);
    if (connection) {
      connection.ws.close();
      this.connections.delete(analysisId);
    }
  }

  public closeAllConnections(): void {
    this.connections.forEach((connection) => {
      connection.ws.close();
    });
    this.connections.clear();
  }
} 