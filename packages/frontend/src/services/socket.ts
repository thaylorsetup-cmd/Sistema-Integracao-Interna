import { io, Socket } from 'socket.io-client';
import type { Submission } from './api';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

// =====================================================
// TIPOS DE EVENTOS
// =====================================================

export interface SubmissionNewEvent {
  submission: Submission;
}

export interface SubmissionUpdatedEvent {
  submission: Submission;
  previousStatus: string;
}

export interface NotificationEvent {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  userId?: string;
}

export interface DashboardStatsEvent {
  fila: {
    total: number;
    pendentes: number;
    emAnalise: number;
    aprovados: number;
    rejeitados: number;
    devolvidos?: number;
  };
}

export interface SubmissionDevolvidaEvent {
  id: string;
  motivoDevolucao: string;
  categoria?: string;
  analista?: string;
}

// =====================================================
// SINGLETON SOCKET
// =====================================================

let socket: Socket | null = null;

/**
 * Obter instancia do socket (criar se nao existir)
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
    console.log('[Socket] Nova instância criada');

    // Logs de conexao
    socket.on('connect', () => {
      console.log('[Socket] Conectado:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Desconectado:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Erro de conexao:', error.message);
    });
  }

  return socket;
}

/**
 * Conectar ao servidor
 */
export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

/**
 * Desconectar do servidor
 */
export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

/**
 * Entrar na sala da fila
 */
export function joinFila(): void {
  getSocket().emit('join:fila');
}

/**
 * Sair da sala da fila
 */
export function leaveFila(): void {
  getSocket().emit('leave:fila');
}

/**
 * Entrar na sala do usuario
 */
export function joinUser(userId: string): void {
  getSocket().emit('join:user', userId);
}

/**
 * Entrar na sala do dashboard
 */
export function joinDashboard(): void {
  getSocket().emit('join:dashboard');
}

/**
 * Entrar na sala do TV Display
 */
export function joinTvDisplay(): void {
  getSocket().emit('join:tv');
}

// =====================================================
// LISTENERS
// =====================================================

type EventCallback<T> = (data: T) => void;

/**
 * Escutar novas submissions
 */
export function onSubmissionNew(callback: EventCallback<SubmissionNewEvent>): () => void {
  const s = getSocket();
  s.on('submission:new', callback);
  return () => s.off('submission:new', callback);
}

/**
 * Escutar atualizacoes de submissions
 */
export function onSubmissionUpdated(callback: EventCallback<SubmissionUpdatedEvent>): () => void {
  const s = getSocket();
  s.on('submission:updated', callback);
  return () => s.off('submission:updated', callback);
}

/**
 * Escutar notificacoes
 */
export function onNotification(callback: EventCallback<NotificationEvent>): () => void {
  const s = getSocket();
  s.on('notification', callback);
  return () => s.off('notification', callback);
}

/**
 * Escutar atualizacoes de stats do dashboard
 */
export function onDashboardStats(callback: EventCallback<DashboardStatsEvent>): () => void {
  const s = getSocket();
  s.on('dashboard:stats', callback);
  return () => s.off('dashboard:stats', callback);
}

/**
 * Escutar submissions devolvidas
 */
export function onSubmissionDevolvida(callback: EventCallback<SubmissionDevolvidaEvent>): () => void {
  const s = getSocket();
  s.on('submission:devolvida', callback);
  return () => s.off('submission:devolvida', callback);
}

export default {
  getSocket,
  connectSocket,
  disconnectSocket,
  joinFila,
  leaveFila,
  joinUser,
  joinDashboard,
  joinTvDisplay,
  onSubmissionNew,
  onSubmissionUpdated,
  onNotification,
  onDashboardStats,
  onSubmissionDevolvida,
};
