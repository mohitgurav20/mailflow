import http from 'http';
import { WebSocketServer } from 'ws';
import { createApp } from './app.js';
import { WebSocketGateway } from './services/wsServer.js';
import { DataStore } from './services/store.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

async function bootstrap() {
  // Initialize DataStore
  const store = DataStore.getInstance();
  console.log(`[DataStore] Loaded ${store.hubs.size} Indian hubs and ${store.legs.size} multimodal legs.`);

  const app = createApp();
  const server = http.createServer(app);

  // Initialize WebSocket Server attached to HTTP server
  const wss = new WebSocketServer({ server });
  WebSocketGateway.getInstance().initialize(wss);

  server.listen(PORT, () => {
    console.log(`
===============================================================
  MailFlow Operations Engine (Department of Posts - SIH260461)
  HTTP REST API: http://localhost:${PORT}/api
  WebSocket:     ws://localhost:${PORT}
  Health Check:  http://localhost:${PORT}/api/health
===============================================================
    `);
  });
}

bootstrap().catch(err => {
  console.error('Fatal error bootstrapping MailFlow API server:', err);
  process.exit(1);
});
