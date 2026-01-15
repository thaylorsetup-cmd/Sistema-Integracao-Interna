/**
 * Rotas de Autenticação
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, Errors } from '../middlewares/error.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as authService from '../services/auth.service.js';
import * as auditService from '../services/audit.service.js';
import { PERMISSIONS } from '../middlewares/permission.middleware.js';

const router = Router();

// Schemas de validação
const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha obrigatória'),
});

/**
 * POST /api/auth/login
 * Autentica usuário e retorna token JWT
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);

    const result = await authService.login(email, password);

    if (!result) {
        throw Errors.Unauthorized('Credenciais inválidas');
    }

    // Registrar log de login
    await auditService.createLog({
        usuario_id: result.user.id,
        usuario_nome: result.user.name,
        tipo: 'LOGIN',
        modulo: 'Autenticação',
        descricao: 'Login realizado com sucesso',
        ip: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
        success: true,
        data: result,
    });
}));

/**
 * POST /api/auth/logout
 * Invalida sessão (frontend deve descartar token)
 */
router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
    // Registrar log de logout
    if (req.user) {
        await auditService.createLog({
            usuario_id: req.user.id,
            usuario_nome: req.user.name,
            tipo: 'LOGOUT',
            modulo: 'Autenticação',
            descricao: 'Logout realizado',
            ip: req.ip || req.socket.remoteAddress || null,
        });
    }

    res.json({
        success: true,
        message: 'Logout realizado com sucesso',
    });
}));

/**
 * GET /api/auth/me
 * Retorna dados do usuário logado
 */
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw Errors.Unauthorized();
    }

    const { password_hash, ...userWithoutPassword } = req.user;

    // Calcular permissões
    const permissions: Record<string, boolean> = {};
    for (const [key, allowedRoles] of Object.entries(PERMISSIONS)) {
        permissions[key] = allowedRoles.includes(req.user.role);
    }

    res.json({
        success: true,
        data: {
            user: userWithoutPassword,
            permissions,
        },
    });
}));

/**
 * POST /api/auth/refresh
 * Renova o token JWT
 */
router.post('/refresh', authenticate, asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw Errors.Unauthorized();
    }

    // Buscar usuário atualizado
    const user = await authService.getUserById(req.user.id);

    if (!user) {
        throw Errors.Unauthorized('Usuário não encontrado');
    }

    // Gerar novo token
    const result = await authService.login(user.email, '');

    // Como o user já está autenticado, geramos um novo token diretamente
    const { generateToken } = await import('../middlewares/auth.middleware.js');
    const token = generateToken(req.user);

    res.json({
        success: true,
        data: { token },
    });
}));

export default router;
