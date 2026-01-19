/**
 * Event Handlers do WebSocket
 * Define os eventos e handlers
 */
import type { Server } from 'socket.io';
import type { AuthenticatedSocket } from './auth.socket.js';
import { isSocketAuthenticated } from './auth.socket.js';
import { logger } from '../config/logger.js';

// Tipos de eventos
export interface SubmissionNewEvent {
  id: string;
  nomeMotorista: string;
  status: string;
  prioridade: string;
  operadorNome?: string;
}

export interface SubmissionUpdatedEvent {
  id: string;
  status: string;
  previousStatus: string;
  analistaNome?: string;
}

export interface NotificationEvent {
  type: 'info' | 'success' | 'warning' | 'error' | 'delay';
  title: string;
  message: string;
  userId?: string; // Se definido, envia apenas para este usuario
  submissionId?: string;
}

export interface SubmissionDelayEvent {
  submissionId: string;
  delay: {
    id: string;
    motivo: string;
    criado_em: Date;
    criado_por_nome?: string;
  };
}

/**
 * Configura handlers de eventos
 */
export function setupEventHandlers(io: Server) {
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(
      `Socket conectado: ${socket.id} (user: ${socket.userEmail || 'anonimo'})`
    );

    // Entrar na sala da fila
    socket.on('join:fila', () => {
      socket.join('fila');
      logger.debug(`${socket.userEmail || socket.id} entrou na sala fila`);
    });

    // Sair da sala da fila
    socket.on('leave:fila', () => {
      socket.leave('fila');
      logger.debug(`${socket.userEmail || socket.id} saiu da sala fila`);
    });

    // Entrar na sala do usuario (para notificacoes pessoais)
    socket.on('join:user', (userId: string) => {
      if (isSocketAuthenticated(socket) && socket.userId === userId) {
        socket.join(`user:${userId}`);
        logger.debug(`${socket.userEmail} entrou na sala pessoal`);
      }
    });

    // Entrar na sala do dashboard (para atualizacoes em tempo real)
    socket.on('join:dashboard', () => {
      if (isSocketAuthenticated(socket)) {
        socket.join('dashboard');
        logger.debug(`${socket.userEmail} entrou na sala dashboard`);
      }
    });

    // Entrar na sala de TV Display (publico)
    socket.on('join:tv', () => {
      socket.join('tv-display');
      logger.debug(`${socket.id} entrou na sala TV Display`);
    });

    // Desconexao
    socket.on('disconnect', (reason) => {
      logger.info(
        `Socket desconectado: ${socket.id} (${socket.userEmail || 'anonimo'}) - ${reason}`
      );
    });

    // Erro
    socket.on('error', (error) => {
      logger.error(`Socket error ${socket.id}:`, error);
    });
  });
}

/**
 * Emite evento de nova submission
 */
export function emitSubmissionNew(io: Server, data: SubmissionNewEvent) {
  io.to('fila').emit('submission:new', data);
  io.to('dashboard').emit('submission:new', data);
  io.to('tv-display').emit('submission:new', data);

  logger.debug(`Evento submission:new emitido para ${data.id}`);
}

/**
 * Emite evento de submission atualizada
 */
export function emitSubmissionUpdated(io: Server, data: SubmissionUpdatedEvent) {
  io.to('fila').emit('submission:updated', data);
  io.to('dashboard').emit('submission:updated', data);
  io.to('tv-display').emit('submission:updated', data);

  logger.debug(
    `Evento submission:updated emitido: ${data.id} (${data.previousStatus} -> ${data.status})`
  );
}

/**
 * Emite notificacao
 */
export function emitNotification(io: Server, data: NotificationEvent) {
  if (data.userId) {
    // Notificacao para usuario especifico
    io.to(`user:${data.userId}`).emit('notification', data);
  } else {
    // Notificacao broadcast
    io.emit('notification', data);
  }

  logger.debug(`Notificacao emitida: ${data.title}`);
}

/**
 * Emite atualizacao de stats do dashboard
 */
export function emitDashboardStats(io: Server, stats: unknown) {
  io.to('dashboard').emit('dashboard:stats', stats);
}

/**
 * Emite evento de atraso adicionado
 */
export function emitSubmissionDelay(
  io: Server,
  data: SubmissionDelayEvent,
  operadorId?: string
) {
  // Emitir para salas gerais
  io.to('fila').emit('submission:delay', data);
  io.to('dashboard').emit('submission:delay', data);
  io.to('tv-display').emit('submission:delay', data);

  // Notificar operador especifico se fornecido
  if (operadorId) {
    emitNotification(io, {
      type: 'delay',
      title: 'Atraso Registrado',
      message: `Atraso adicionado no seu cadastro: ${data.delay.motivo}`,
      userId: operadorId,
      submissionId: data.submissionId,
    });
  }

  logger.debug(`Evento submission:delay emitido para ${data.submissionId}`);
}
