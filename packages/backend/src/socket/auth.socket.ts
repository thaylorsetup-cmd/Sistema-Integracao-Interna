/**
 * Autenticacao de WebSocket
 * Middleware para verificar sessao em conexoes socket
 */
import type { Socket } from 'socket.io';
import { auth } from '../auth.js';
import { logger } from '../config/logger.js';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

/**
 * Middleware de autenticacao para Socket.IO
 */
export async function socketAuthMiddleware(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) {
  try {
    // Tentar obter cookie da conexao
    const cookies = socket.handshake.headers.cookie;

    if (!cookies) {
      logger.debug('Socket sem cookies de autenticacao');
      // Permitir conexao anonima (para TV Display, por exemplo)
      return next();
    }

    // Criar headers para o better-auth
    const headers = new Headers();
    headers.set('cookie', cookies);

    // Verificar sessao
    const session = await auth.api.getSession({ headers });

    if (session?.user) {
      socket.userId = session.user.id;
      socket.userEmail = session.user.email;
      socket.userRole = session.user.role as string;

      logger.debug(`Socket autenticado: ${session.user.email}`);
    }

    next();
  } catch (error) {
    logger.error('Erro na autenticacao socket:', error);
    // Nao bloqueia conexao, apenas loga o erro
    next();
  }
}

/**
 * Verifica se socket esta autenticado
 */
export function isSocketAuthenticated(socket: AuthenticatedSocket): boolean {
  return !!socket.userId;
}

/**
 * Requer autenticacao para eventos
 */
export function requireSocketAuth(socket: AuthenticatedSocket): boolean {
  if (!socket.userId) {
    socket.emit('error', {
      code: 'UNAUTHORIZED',
      message: 'Autenticacao necessaria',
    });
    return false;
  }
  return true;
}
