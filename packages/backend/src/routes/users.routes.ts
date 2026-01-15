/**
 * Rotas de Usuários
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, Errors } from '../middlewares/error.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize, requirePermission } from '../middlewares/permission.middleware.js';
import { db } from '../config/database.js';
import * as authService from '../services/auth.service.js';
import * as auditService from '../services/audit.service.js';
import type { UserRole } from '../types/database.js';

const router = Router();

// Schemas
const createUserSchema = z.object({
    name: z.string().min(2, 'Nome muito curto'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    telefone: z.string().optional(),
    role: z.enum(['admin', 'gestor', 'operacional', 'cadastro', 'comercial']),
    departamento: z.string().min(2, 'Departamento obrigatório'),
});

const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    telefone: z.string().optional(),
    role: z.enum(['admin', 'gestor', 'operacional', 'cadastro', 'comercial']).optional(),
    departamento: z.string().optional(),
});

/**
 * GET /api/users
 * Lista todos os usuários (admin e gestor)
 */
router.get('/', authenticate, requirePermission('manageUsers'), asyncHandler(async (req: Request, res: Response) => {
    const users = await db
        .selectFrom('users')
        .select(['id', 'name', 'email', 'telefone', 'role', 'departamento', 'avatar', 'ativo', 'created_at', 'updated_at'])
        .orderBy('name', 'asc')
        .execute();

    res.json({
        success: true,
        data: users,
    });
}));

/**
 * POST /api/users
 * Cria novo usuário (somente admin)
 */
router.post('/', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
    const data = createUserSchema.parse(req.body);

    // Verificar se email já existe
    const existingUser = await authService.getUserByEmail(data.email);
    if (existingUser) {
        throw Errors.Conflict('Email já cadastrado');
    }

    const user = await authService.createUser(data);

    // Log de criação
    await auditService.createLog({
        usuario_id: req.user!.id,
        usuario_nome: req.user!.name,
        tipo: 'CRIAR',
        modulo: 'Usuários',
        descricao: `Usuário ${user.name} criado`,
        detalhes: { userId: user.id, email: user.email },
        ip: req.ip || null,
    });

    res.status(201).json({
        success: true,
        data: user,
    });
}));

/**
 * GET /api/users/:id
 * Busca usuário por ID
 */
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Usuário pode ver seus próprios dados, admin/gestor podem ver todos
    if (req.user!.id !== id && !['admin', 'gestor'].includes(req.user!.role)) {
        throw Errors.Forbidden('Sem permissão para ver este usuário');
    }

    const user = await db
        .selectFrom('users')
        .select(['id', 'name', 'email', 'telefone', 'role', 'departamento', 'avatar', 'ativo', 'created_at', 'updated_at'])
        .where('id', '=', id)
        .executeTakeFirst();

    if (!user) {
        throw Errors.NotFound('Usuário');
    }

    res.json({
        success: true,
        data: user,
    });
}));

/**
 * PUT /api/users/:id
 * Atualiza usuário
 */
router.put('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    // Somente admin pode atualizar outros usuários
    if (req.user!.id !== id && req.user!.role !== 'admin') {
        throw Errors.Forbidden('Sem permissão para editar este usuário');
    }

    // Somente admin pode alterar role
    if (data.role && req.user!.role !== 'admin') {
        delete data.role;
    }

    const [user] = await db
        .updateTable('users')
        .set({ ...data, updated_at: new Date() })
        .where('id', '=', id)
        .returning(['id', 'name', 'email', 'telefone', 'role', 'departamento', 'avatar', 'ativo', 'created_at', 'updated_at'])
        .execute();

    if (!user) {
        throw Errors.NotFound('Usuário');
    }

    // Log
    await auditService.createLog({
        usuario_id: req.user!.id,
        usuario_nome: req.user!.name,
        tipo: 'EDITAR',
        modulo: 'Usuários',
        descricao: `Usuário ${user.name} atualizado`,
        detalhes: { userId: user.id, changes: data },
        ip: req.ip || null,
    });

    res.json({
        success: true,
        data: user,
    });
}));

/**
 * PATCH /api/users/:id/status
 * Ativa ou desativa usuário
 */
router.patch('/:id/status', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ativo } = z.object({ ativo: z.boolean() }).parse(req.body);

    // Não pode desativar a si mesmo
    if (req.user!.id === id && !ativo) {
        throw Errors.BadRequest('Você não pode desativar sua própria conta');
    }

    const [user] = await db
        .updateTable('users')
        .set({ ativo, updated_at: new Date() })
        .where('id', '=', id)
        .returning(['id', 'name', 'email', 'ativo'])
        .execute();

    if (!user) {
        throw Errors.NotFound('Usuário');
    }

    // Log
    await auditService.createLog({
        usuario_id: req.user!.id,
        usuario_nome: req.user!.name,
        tipo: 'EDITAR',
        modulo: 'Usuários',
        descricao: `Usuário ${user.name} ${ativo ? 'ativado' : 'desativado'}`,
        detalhes: { userId: user.id, ativo },
        ip: req.ip || null,
    });

    res.json({
        success: true,
        data: user,
    });
}));

export default router;
