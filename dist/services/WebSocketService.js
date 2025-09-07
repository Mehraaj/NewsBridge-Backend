"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const ws_1 = require("ws");
const uuid_1 = require("uuid");
class WebSocketService {
    constructor(server) {
        this.connections = new Map();
        this.wss = new ws_1.WebSocketServer({
            server,
            path: '/analysis'
        });
        this.setupWebSocketHandlers();
    }
    setupWebSocketHandlers() {
        this.wss.on('connection', (ws, req) => {
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
                if (ws.readyState === ws_1.WebSocket.OPEN) {
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
    sendEnhancedAnalysis(analysisId, data) {
        const connection = this.connections.get(analysisId);
        if (connection && connection.ws.readyState === ws_1.WebSocket.OPEN) {
            try {
                connection.ws.send(JSON.stringify({
                    type: 'enhanced_analysis',
                    data,
                    timestamp: new Date().toISOString()
                }));
            }
            catch (error) {
                console.error(`Error sending enhanced analysis for ${analysisId}:`, error);
                this.connections.delete(analysisId);
            }
        }
    }
    generateAnalysisId() {
        return (0, uuid_1.v4)();
    }
    getActiveConnections() {
        return this.connections.size;
    }
    closeConnection(analysisId) {
        const connection = this.connections.get(analysisId);
        if (connection) {
            connection.ws.close();
            this.connections.delete(analysisId);
        }
    }
    closeAllConnections() {
        this.connections.forEach((connection) => {
            connection.ws.close();
        });
        this.connections.clear();
    }
}
exports.WebSocketService = WebSocketService;
