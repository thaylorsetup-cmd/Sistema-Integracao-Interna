/**
 * Middleware de Autenticacao
 * Verifica sessao via Better-Auth
 */
import type { Response, NextFunction } from 'express';
import { auth } from '../auth.js';
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
    // Obter sessao do better-auth
    const session = await auth.api.getSession({
      headers: req.headers as Headers,
    });

    if (!session || !session.user) {
      res.status(401).json({
        success: false,
        error: 'Nao autenticado',
        message: 'Sessao invalida ou expirada',
      });
      return;
    }

    // Verificar se usuario esta ativo
    if (!session.user.ativo) {
      res.status(403).json({
        success: false,
        error: 'Usuario desativado',
        message: 'Sua conta foi desativada. Contate o administrador.',
      });
      return;
    }

    // Adicionar usuario e sessao ao request
    req.user = session.user as AuthenticatedRequest['user'];
    req.session = {
      id: session.session.id,
      userId: session.user.id,
      expiresAt: new Date(session.session.expiresAt),
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
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as Headers,
    });

    if (session?.user) {
      req.user = session.user as AuthenticatedRequest['user'];
      req.session = {
        id: session.session.id,
        userId: session.user.id,
        expiresAt: new Date(session.session.expiresAt),
      };
    }

    next();
  } catch (error) {
    // Em caso de erro, continua sem autenticacao
    logger.debug('Autenticacao opcional falhou:', error);
    next();
  }
}
