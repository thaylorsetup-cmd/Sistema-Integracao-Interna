/**
 * Autenticacao de WebSocket
 * Middleware para verificar sessao em conexoes socket
 */
import type { Socket } from 'socket.io';
import { db } from '../config/database.js';
import { logger } from '../config/logger.js';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

/**
 * Extrai valor de um cookie especifico da string de cookies
 */
function parseCookie(cookieHeader: string, name: string): string | undefined {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Middleware de autenticacao para Socket.IO
 */
export async function socketAuthMiddleware(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) {
  try {
    const cookies = socket.handshake.headers.cookie;

    if (!cookies) {
      logger.debug('Socket sem cookies de autenticacao');
      // Permitir conexao anonima (para TV Display, por exemplo)
      return next();
    }

    const token = parseCookie(cookies, 'bbt_session');

    if (!token) {
      return next();
    }

    // Verificar sessao no banco
    const result = await db
      .selectFrom('sessions')
      .innerJoin('users', 'users.id', 'sessions.user_id')
      .where('sessions.token', '=', token)
      .where('sessions.expires_at', '>', new Date())
      .where('users.ativo', '=', true)
      .select([
        'users.id',
        'users.email',
        'users.role',
      ])
      .executeTakeFirst();

    if (result) {
      socket.userId = result.id;
      socket.userEmail = result.email;
      socket.userRole = result.role;

      logger.debug(`Socket autenticado: ${result.email}`);
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
