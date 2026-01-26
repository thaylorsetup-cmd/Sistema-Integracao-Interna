/**
 * Rotas de Autenticacao
 * Login via codigo OTP enviado por email
 */
import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../config/database.js';
import { env } from '../config/env.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';
import { getPermissions } from '../middlewares/permission.middleware.js';
import { authRateLimiter } from '../middlewares/rate-limit.middleware.js';
import { sendVerificationCode } from '../services/email.service.js';
import { logger } from '../config/logger.js';
import type { AuthenticatedRequest } from '../types/api.js';
import type { UserRole } from '../types/database.js';

const router = Router();

// Schemas de validacao
const sendCodeSchema = z.object({
  email: z.string().email('Email invalido'),
});

const verifyCodeSchema = z.object({
  email: z.string().email('Email invalido'),
  code: z.string().length(6, 'Codigo deve ter 6 digitos'),
});

// Schema para login simples com senha
const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'Senha obrigatoria'),
});

/**
 * POST /api/auth/login
 * Login simples com email e senha (para ambiente interno)
 */
router.post('/login', authRateLimiter, async (req, res): Promise<any> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Buscar usuario
    const user = await db
      .selectFrom('users')
      .where('email', '=', email)
      .select(['id', 'email', 'nome', 'role', 'ativo', 'filial_id', 'avatar', 'password'])
      .executeTakeFirst();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais invalidas',
        message: 'Email ou senha incorretos.',
      });
    }

    // Verificar se usuario esta ativo
    if (!user.ativo) {
      return res.status(403).json({
        success: false,
        error: 'Usuario desativado',
        message: 'Sua conta foi desativada. Contate o administrador.',
      });
    }

    // Verificar senha (comparacao simples - ambiente interno)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais invalidas',
        message: 'Email ou senha incorretos.',
      });
    }

    // Gerar token de sessao
    const token = crypto.randomUUID();

    // Criar sessao (7 dias)
    await db
      .insertInto('sessions')
      .values({
        token,
        user_id: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ip_address: req.ip || null,
        user_agent: req.headers['user-agent'] || null,
      })
      .execute();

    // Setar cookie
    res.cookie('bbt_session', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    // Retornar dados do usuario com permissoes
    const permissions = getPermissions(user.role as UserRole);

    logger.info(`Login realizado: ${user.email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          nome: user.nome,
          role: user.role,
          ativo: user.ativo,
          avatar: user.avatar,
          filialId: user.filial_id,
        },
        permissions,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados invalidos',
        details: error.errors,
      });
    }

    logger.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: 'Erro ao processar login',
    });
  }
});

/**
 * POST /api/auth/send-code
 * Envia codigo de verificacao por email (mantido para compatibilidade)
 */
router.post('/send-code', authRateLimiter, async (req, res): Promise<any> => {
  try {
    const { email } = sendCodeSchema.parse(req.body);

    // Verificar se usuario existe e esta ativo
    const user = await db
      .selectFrom('users')
      .where('email', '=', email)
      .select(['id', 'email', 'nome', 'ativo'])
      .executeTakeFirst();

    if (!user || !user.ativo) {
      // Retornar sucesso mesmo se email nao existe (seguranca)
      return res.json({
        success: true,
        message: 'Se o email estiver cadastrado, voce recebera um codigo de acesso.',
      });
    }

    // Invalidar codigos anteriores nao usados
    await db
      .updateTable('auth_codes')
      .set({ used: true })
      .where('email', '=', email)
      .where('used', '=', false)
      .execute();

    // Gerar codigo de 6 digitos
    const code = crypto.randomInt(100000, 999999).toString();

    // Salvar codigo no banco
    await db
      .insertInto('auth_codes')
      .values({
        email,
        code,
        expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
        ip_address: req.ip || null,
      })
      .execute();

    // Enviar email
    const sent = await sendVerificationCode(email, code);

    if (!sent) {
      logger.error(`Falha ao enviar email para ${email}`);
      return res.status(500).json({
        success: false,
        error: 'Erro ao enviar email',
        message: 'Nao foi possivel enviar o codigo. Tente novamente.',
      });
    }

    res.json({
      success: true,
      message: 'Se o email estiver cadastrado, voce recebera um codigo de acesso.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados invalidos',
        details: error.errors,
      });
    }

    logger.error('Erro ao enviar codigo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: 'Erro ao processar solicitacao',
    });
  }
});

/**
 * POST /api/auth/verify-code
 * Verifica codigo e cria sessao
 */
router.post('/verify-code', authRateLimiter, async (req, res): Promise<any> => {
  try {
    const { email, code } = verifyCodeSchema.parse(req.body);

    // Buscar codigo valido
    const authCode = await db
      .selectFrom('auth_codes')
      .where('email', '=', email)
      .where('code', '=', code)
      .where('used', '=', false)
      .where('expires_at', '>', new Date())
      .select(['id', 'email'])
      .executeTakeFirst();

    if (!authCode) {
      return res.status(401).json({
        success: false,
        error: 'Codigo invalido',
        message: 'Codigo invalido ou expirado. Solicite um novo codigo.',
      });
    }

    // Marcar codigo como usado
    await db
      .updateTable('auth_codes')
      .set({ used: true })
      .where('id', '=', authCode.id)
      .execute();

    // Buscar usuario
    const user = await db
      .selectFrom('users')
      .where('email', '=', email)
      .where('ativo', '=', true)
      .select(['id', 'email', 'nome', 'role', 'ativo', 'filial_id', 'avatar'])
      .executeTakeFirst();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario nao encontrado',
        message: 'Usuario nao encontrado ou desativado.',
      });
    }

    // Gerar token de sessao
    const token = crypto.randomUUID();

    // Criar sessao (7 dias)
    await db
      .insertInto('sessions')
      .values({
        token,
        user_id: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ip_address: req.ip || null,
        user_agent: req.headers['user-agent'] || null,
      })
      .execute();

    // Setar cookie
    res.cookie('bbt_session', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    // Retornar dados do usuario com permissoes
    const permissions = getPermissions(user.role as UserRole);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          nome: user.nome,
          role: user.role,
          ativo: user.ativo,
          avatar: user.avatar,
          filialId: user.filial_id,
        },
        permissions,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados invalidos',
        details: error.errors,
      });
    }

    logger.error('Erro ao verificar codigo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: 'Erro ao processar verificacao',
    });
  }
});

/**
 * GET /api/auth/me
 * Retorna dados do usuario autenticado com permissoes
 */
router.get('/me', requireAuth, async (req, res): Promise<any> => {
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
        filialId: authReq.user.filial_id,
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
router.get('/permissions', requireAuth, async (req, res): Promise<any> => {
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
 * POST /api/auth/sign-out
 * Logout - invalida sessao
 */
router.post('/sign-out', async (req, res) => {
  try {
    const token = req.cookies?.bbt_session;

    if (token) {
      await db
        .deleteFrom('sessions')
        .where('token', '=', token)
        .execute();
    }

    res.clearCookie('bbt_session', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    logger.error('Erro no logout:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer logout',
    });
  }
});

/**
 * PUT /api/auth/change-password
 * Altera a senha do usuario autenticado
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatoria'),
  newPassword: z.string().min(3, 'Nova senha deve ter no minimo 3 caracteres'),
});

router.put('/change-password', requireAuth, async (req, res): Promise<any> => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        error: 'Nao autenticado',
      });
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // Buscar usuario com senha atual
    const user = await db
      .selectFrom('users')
      .where('id', '=', authReq.user.id)
      .select(['id', 'email', 'password'])
      .executeTakeFirst();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario nao encontrado',
      });
    }

    // Verificar senha atual
    if (user.password !== currentPassword) {
      return res.status(400).json({
        success: false,
        error: 'Senha atual incorreta',
        message: 'A senha atual informada esta incorreta.',
      });
    }

    // Verificar se a nova senha e diferente da atual
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Senha repetida',
        message: 'A nova senha deve ser diferente da senha atual.',
      });
    }

    // Atualizar senha
    await db
      .updateTable('users')
      .set({ password: newPassword })
      .where('id', '=', authReq.user.id)
      .execute();

    logger.info(`Senha alterada: ${user.email}`);

    res.json({
      success: true,
      message: 'Senha alterada com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados invalidos',
        details: error.errors,
      });
    }

    logger.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao alterar senha',
    });
  }
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
