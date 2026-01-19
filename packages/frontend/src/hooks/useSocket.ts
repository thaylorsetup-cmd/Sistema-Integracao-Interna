import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import {
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
  getSocket,
  type SubmissionNewEvent,
  type SubmissionUpdatedEvent,
  type NotificationEvent,
  type DashboardStatsEvent,
} from '@/services/socket';

// Re-export types para facilitar importação
export type { SubmissionNewEvent, SubmissionUpdatedEvent, NotificationEvent, DashboardStatsEvent };

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useSocket() {
  const { isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  // Conectar/desconectar baseado na autenticacao
  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();

      const socket = getSocket();

      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      // Se ja estiver conectado
      if (socket.connected) {
        setIsConnected(true);
      }

      // Entrar na sala do usuario
      if (user?.id) {
        joinUser(user.id);
      }

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        disconnectSocket();
      };
    }
  }, [isAuthenticated, user?.id]);

  return { isConnected };
}

// =====================================================
// HOOK PARA FILA
// =====================================================

export function useFilaSocket(options?: {
  onNew?: (data: SubmissionNewEvent) => void;
  onUpdated?: (data: SubmissionUpdatedEvent) => void;
}) {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    connectSocket();
    joinFila();

    const socket = getSocket();
    setIsConnected(socket.connected);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Listeners de eventos
    const unsubNew = options?.onNew ? onSubmissionNew(options.onNew) : undefined;
    const unsubUpdated = options?.onUpdated ? onSubmissionUpdated(options.onUpdated) : undefined;

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      leaveFila();
      unsubNew?.();
      unsubUpdated?.();
    };
  }, [isAuthenticated, options?.onNew, options?.onUpdated]);

  return { isConnected };
}

// =====================================================
// HOOK PARA DASHBOARD
// =====================================================

export function useDashboardSocket(options?: {
  onStats?: (data: DashboardStatsEvent) => void;
  onSubmissionNew?: (data: SubmissionNewEvent) => void;
  onSubmissionUpdated?: (data: SubmissionUpdatedEvent) => void;
}) {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    connectSocket();
    joinDashboard();

    const socket = getSocket();
    setIsConnected(socket.connected);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Listeners
    const unsubStats = options?.onStats ? onDashboardStats(options.onStats) : undefined;
    const unsubNew = options?.onSubmissionNew ? onSubmissionNew(options.onSubmissionNew) : undefined;
    const unsubUpdated = options?.onSubmissionUpdated
      ? onSubmissionUpdated(options.onSubmissionUpdated)
      : undefined;

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      unsubStats?.();
      unsubNew?.();
      unsubUpdated?.();
    };
  }, [isAuthenticated, options?.onStats, options?.onSubmissionNew, options?.onSubmissionUpdated]);

  return { isConnected };
}

// =====================================================
// HOOK PARA TV DISPLAY (SEM AUTENTICACAO)
// =====================================================

export function useTvDisplaySocket(options?: {
  onSubmissionNew?: (data: SubmissionNewEvent) => void;
  onSubmissionUpdated?: (data: SubmissionUpdatedEvent) => void;
}) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    connectSocket();
    joinTvDisplay();

    const socket = getSocket();
    setIsConnected(socket.connected);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Listeners
    const unsubNew = options?.onSubmissionNew ? onSubmissionNew(options.onSubmissionNew) : undefined;
    const unsubUpdated = options?.onSubmissionUpdated
      ? onSubmissionUpdated(options.onSubmissionUpdated)
      : undefined;

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      unsubNew?.();
      unsubUpdated?.();
    };
  }, [options?.onSubmissionNew, options?.onSubmissionUpdated]);

  return { isConnected };
}

// =====================================================
// HOOK PARA NOTIFICACOES
// =====================================================

export function useNotifications(onNotify?: (notification: NotificationEvent) => void) {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !onNotify) return;

    connectSocket();

    if (user?.id) {
      joinUser(user.id);
    }

    const unsub = onNotification(onNotify);

    return () => {
      unsub();
    };
  }, [isAuthenticated, user?.id, onNotify]);
}

export default useSocket;
