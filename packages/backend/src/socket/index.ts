/**
 * Configuracao do Socket.IO
 * Setup principal do WebSocket
 */
import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { socketAuthMiddleware } from './auth.socket.js';
import { setupEventHandlers } from './events.js';

let io: Server | null = null;

/**
 * Inicializa o Socket.IO
 */
export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Middleware de autenticacao
  io.use(socketAuthMiddleware);

  // Setup de eventos
  setupEventHandlers(io);

  logger.info('Socket.IO inicializado');

  return io;
}

/**
 * Retorna instancia do Socket.IO
 */
export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO nao foi inicializado');
  }
  return io;
}

/**
 * Verifica se Socket.IO esta inicializado
 */
export function isSocketInitialized(): boolean {
  return io !== null;
}

// Re-export de funcoes de emissao
export {
  emitSubmissionNew,
  emitSubmissionUpdated,
  emitNotification,
  emitDashboardStats,
  emitSubmissionDelay,
} from './events.js';

export type { AuthenticatedSocket } from './auth.socket.js';
