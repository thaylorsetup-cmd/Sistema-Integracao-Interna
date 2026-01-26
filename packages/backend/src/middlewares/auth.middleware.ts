/**
 * Middleware de Autenticacao
 * Verifica sessao via cookie bbt_session
 */
import type { Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { logger } from '../config/logger.js';
import type { AuthenticatedRequest } from '../types/api.js';

/**
 * Middleware que requer autenticacao
 * Verifica se o usuario tem uma sessao valida
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.bbt_session;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Nao autenticado',
        message: 'Sessao invalida ou expirada',
      });
      return;
    }

    // Buscar sessao e usuario
    const result = await db
      .selectFrom('sessions')
      .innerJoin('users', 'users.id', 'sessions.user_id')
      .where('sessions.token', '=', token)
      .where('sessions.expires_at', '>', new Date())
      .select([
        'sessions.id as session_id',
        'sessions.expires_at',
        'users.id',
        'users.email',
        'users.nome',
        'users.role',
        'users.ativo',
        'users.filial_id',
        'users.avatar',
      ])
      .executeTakeFirst();

    if (!result) {
      res.status(401).json({
        success: false,
        error: 'Nao autenticado',
        message: 'Sessao invalida ou expirada',
      });
      return;
    }

    // Verificar se usuario esta ativo
    if (!result.ativo) {
      res.status(403).json({
        success: false,
        error: 'Usuario desativado',
        message: 'Sua conta foi desativada. Contate o administrador.',
      });
      return;
    }

    // Adicionar usuario e sessao ao request
    req.user = {
      id: result.id,
      email: result.email,
      nome: result.nome,
      role: result.role,
      ativo: result.ativo,
      filial_id: result.filial_id,
      avatar: result.avatar,
    } as AuthenticatedRequest['user'];

    req.session = {
      id: result.session_id,
      userId: result.id,
      expiresAt: new Date(result.expires_at),
    };

    next();
  } catch (error) {
    logger.error('Erro na autenticacao:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: 'Erro ao verificar autenticacao',
    });
  }
}

/**
 * Middleware opcional de autenticacao
 * Adiciona usuario se estiver autenticado, mas permite acesso sem autenticacao
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.bbt_session;

    if (!token) {
      return next();
    }

    const result = await db
      .selectFrom('sessions')
      .innerJoin('users', 'users.id', 'sessions.user_id')
      .where('sessions.token', '=', token)
      .where('sessions.expires_at', '>', new Date())
      .select([
        'sessions.id as session_id',
        'sessions.expires_at',
        'users.id',
        'users.email',
        'users.nome',
        'users.role',
        'users.ativo',
        'users.filial_id',
        'users.avatar',
      ])
      .executeTakeFirst();

    if (result && result.ativo) {
      req.user = {
        id: result.id,
        email: result.email,
        nome: result.nome,
        role: result.role,
        ativo: result.ativo,
        filial_id: result.filial_id,
        avatar: result.avatar,
      } as AuthenticatedRequest['user'];

      req.session = {
        id: result.session_id,
        userId: result.id,
        expiresAt: new Date(result.expires_at),
      };
    }

    next();
  } catch (error) {
    logger.debug('Autenticacao opcional falhou:', error);
    next();
  }
}
