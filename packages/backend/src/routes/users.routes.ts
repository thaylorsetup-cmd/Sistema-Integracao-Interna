/**
 * Rotas de Usuarios
 * CRUD de usuarios do sistema
 */
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../config/database.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole, requirePermission } from '../middlewares/permission.middleware.js';
import { logger } from '../config/logger.js';
import type { AuthenticatedRequest } from '../types/api.js';
import type { UserRole } from '../types/database.js';

const router = Router();

// Schema de validacao para criar usuario
const createUserSchema = z.object({
  email: z.string().email('Email invalido'),
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  role: z.enum(['admin', 'gestor', 'operacional', 'cadastro', 'comercial']),
  filialId: z.string().optional(),
});

// Schema de validacao para atualizar usuario
const updateUserSchema = z.object({
  nome: z.string().min(2).optional(),
  role: z.enum(['admin', 'gestor', 'operacional', 'cadastro', 'comercial']).optional(),
  ativo: z.boolean().optional(),
  filialId: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
});

/**
 * GET /api/users
 * Lista todos os usuarios
 */
router.get('/', requireAuth, requirePermission('manageUsers'), async (req, res) => {
  try {
    const { role, ativo, search, page = '1', limit = '20' } = req.query;

    let query = db
      .selectFrom('users')
      .select([
        'id',
        'email',
        'nome',
        'role',
        'ativo',
        'filial_id',
        'avatar',
        'created_at',
        'updated_at',
      ]);

    // Filtros
    if (role) {
      query = query.where('role', '=', role as UserRole);
    }

    if (ativo !== undefined) {
      query = query.where('ativo', '=', ativo === 'true');
    }

    if (search && typeof search === 'string') {
      query = query.where((eb) =>
        eb.or([
          eb('nome', 'ilike', `%${search}%`),
          eb('email', 'ilike', `%${search}%`),
        ])
      );
    }

    // Contagem total
    const totalQuery = db
      .selectFrom('users')
      .select(db.fn.count('id').as('count'));

    const [users, totalResult] = await Promise.all([
      query
        .orderBy('created_at', 'desc')
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit))
        .execute(),
      totalQuery.executeTakeFirst(),
    ]);

    const total = Number(totalResult?.count || 0);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: Number(page),
        pageSize: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Erro ao listar usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar usuarios',
    });
  }
});

/**
 * GET /api/users/:id
 * Busca usuario por ID
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Usuario pode ver seus proprios dados ou admin/gestor podem ver todos
    const canViewAll =
      authReq.user?.role === 'admin' || authReq.user?.role === 'gestor';

    if (!canViewAll && authReq.user?.id !== id) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissao',
        message: 'Voce so pode ver seus proprios dados',
      });
    }

    const user = await db
      .selectFrom('users')
      .where('id', '=', id)
      .select([
        'id',
        'email',
        'nome',
        'role',
        'ativo',
        'filial_id',
        'avatar',
        'created_at',
        'updated_at',
      ])
      .executeTakeFirst();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario nao encontrado',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Erro ao buscar usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuario',
    });
  }
});

/**
 * POST /api/users
 * Cria novo usuario (apenas admin)
 */
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const data = createUserSchema.parse(req.body);

    // Verificar se email ja existe
    const existing = await db
      .selectFrom('users')
      .where('email', '=', data.email)
      .selectAll()
      .executeTakeFirst();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Email ja cadastrado',
      });
    }

    const newUser = await db
      .insertInto('users')
      .values({
        email: data.email,
        nome: data.nome,
        role: data.role,
        filial_id: data.filialId,
        ativo: true,
      })
      .returning(['id', 'email', 'nome', 'role', 'ativo', 'created_at'])
      .executeTakeFirst();

    logger.info(`Usuario criado: ${data.email} por ${(req as AuthenticatedRequest).user?.email}`);

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'Usuario criado com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados invalidos',
        details: error.errors,
      });
    }

    logger.error('Erro ao criar usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar usuario',
    });
  }
});

/**
 * PUT /api/users/:id
 * Atualiza usuario
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Usuario pode editar seus dados ou admin pode editar todos
    const isAdmin = authReq.user?.role === 'admin';
    const isSelf = authReq.user?.id === id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissao',
      });
    }

    const data = updateUserSchema.parse(req.body);

    // Usuarios nao-admin nao podem mudar role ou status
    if (!isAdmin) {
      delete data.role;
      delete data.ativo;
    }

    const updated = await db
      .updateTable('users')
      .set({
        ...(data.nome && { nome: data.nome }),
        ...(data.role && { role: data.role }),
        ...(data.ativo !== undefined && { ativo: data.ativo }),
        ...(data.filialId !== undefined && { filial_id: data.filialId }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      })
      .where('id', '=', id)
      .returning(['id', 'email', 'nome', 'role', 'ativo', 'updated_at'])
      .executeTakeFirst();

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Usuario nao encontrado',
      });
    }

    logger.info(`Usuario atualizado: ${updated.email} por ${authReq.user?.email}`);

    res.json({
      success: true,
      data: updated,
      message: 'Usuario atualizado com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados invalidos',
        details: error.errors,
      });
    }

    logger.error('Erro ao atualizar usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar usuario',
    });
  }
});

/**
 * DELETE /api/users/:id
 * Desativa usuario (soft delete)
 */
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Nao pode deletar a si mesmo
    if (authReq.user?.id === id) {
      return res.status(400).json({
        success: false,
        error: 'Nao e possivel desativar a si mesmo',
      });
    }

    const updated = await db
      .updateTable('users')
      .set({ ativo: false })
      .where('id', '=', id)
      .returning(['id', 'email'])
      .executeTakeFirst();

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Usuario nao encontrado',
      });
    }

    logger.info(`Usuario desativado: ${updated.email} por ${authReq.user?.email}`);

    res.json({
      success: true,
      message: 'Usuario desativado com sucesso',
    });
  } catch (error) {
    logger.error('Erro ao desativar usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao desativar usuario',
    });
  }
});

export default router;
