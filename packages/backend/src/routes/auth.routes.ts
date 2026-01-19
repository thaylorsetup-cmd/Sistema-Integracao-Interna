/**
 * Rotas de Autenticacao
 * Proxy para Better-Auth + endpoints customizados
 */
import { Router } from 'express';
import { auth } from '../auth.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';
import { getPermissions } from '../middlewares/permission.middleware.js';
import { authRateLimiter } from '../middlewares/rate-limit.middleware.js';
import { logger } from '../config/logger.js';
import type { AuthenticatedRequest } from '../types/api.js';
import type { UserRole } from '../types/database.js';

const router = Router();

/**
 * Proxy todas as rotas do better-auth
 * POST /api/auth/sign-in/email
 * POST /api/auth/sign-out
 * GET /api/auth/get-session
 * etc.
 */
router.all('/*', authRateLimiter, async (req, res) => {
  try {
    const response = await auth.handler(req, res);
    return response;
  } catch (error) {
    logger.error('Erro no better-auth:', error);
    res.status(500).json({
      success: false,
      error: 'Erro de autenticacao',
      message: 'Erro ao processar requisicao de autenticacao',
    });
  }
});

/**
 * GET /api/auth/me
 * Retorna dados do usuario autenticado com permissoes
 */
router.get('/me', requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user) {
    return res.status(401).json({
      success: false,
      error: 'Nao autenticado',
    });
  }

  const permissions = getPermissions(authReq.user.role as UserRole);

  res.json({
    success: true,
    data: {
      user: {
        id: authReq.user.id,
        email: authReq.user.email,
        nome: authReq.user.nome,
        role: authReq.user.role,
        ativo: authReq.user.ativo,
        avatar: authReq.user.avatar,
        filialId: authReq.user.filialId,
      },
      permissions,
      session: {
        id: authReq.session?.id,
        expiresAt: authReq.session?.expiresAt,
      },
    },
  });
});

/**
 * GET /api/auth/permissions
 * Retorna permissoes do usuario
 */
router.get('/permissions', requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user) {
    return res.status(401).json({
      success: false,
      error: 'Nao autenticado',
    });
  }

  const permissions = getPermissions(authReq.user.role as UserRole);

  res.json({
    success: true,
    data: permissions,
  });
});

/**
 * GET /api/auth/check
 * Verificacao rapida de autenticacao
 */
router.get('/check', optionalAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;

  res.json({
    success: true,
    data: {
      authenticated: !!authReq.user,
      userId: authReq.user?.id,
    },
  });
});

export default router;
