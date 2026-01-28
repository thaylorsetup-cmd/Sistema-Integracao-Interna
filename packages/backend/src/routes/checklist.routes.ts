/**
 * Rotas de Checklist
 * Gerenciamento de checklists por submission
 */
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../config/database.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requirePermission, requireAnyPermission } from '../middlewares/permission.middleware.js';
import { logger } from '../config/logger.js';
import type { AuthenticatedRequest } from '../types/api.js';

const router: Router = Router();

// Schema para marcar item como completo
const completarItemSchema = z.object({
    observacao: z.string().optional(),
});

// Schema para criar item de checklist
const criarItemSchema = z.object({
    item_nome: z.string().min(1, 'Nome do item é obrigatório'),
    observacao: z.string().optional(),
});

/**
 * GET /api/checklist/:submissionId
 * Lista checklist de uma submission
 */
router.get(
    '/:submissionId',
    requireAuth,
    async (req, res) => {
        try {
            const { submissionId } = req.params;

            const items = await db
                .selectFrom('checklists')
                .leftJoin('users', 'checklists.completado_por', 'users.id')
                .where('checklists.submission_id', '=', submissionId)
                .select([
                    'checklists.id',
                    'checklists.submission_id',
                    'checklists.item_nome',
                    'checklists.completado',
                    'checklists.completado_por',
                    'users.nome as completado_por_nome',
                    'checklists.completado_em',
                    'checklists.observacao',
                    'checklists.created_at',
                ])
                .orderBy('checklists.created_at', 'asc')
                .execute();

            res.json({
                success: true,
                data: items,
            });
        } catch (error) {
            logger.error('Erro ao listar checklist:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao listar checklist',
            });
        }
    }
);

/**
 * POST /api/checklist/:submissionId/inicializar
 * Inicializa checklist com base no template do tipo de cadastro
 */
router.post(
    '/:submissionId/inicializar',
    requireAuth,
    requireAnyPermission('aprovarCadastros', 'viewDashboardCadastroGR'),
    async (req, res) => {
        try {
            const { submissionId } = req.params;

            // Buscar submission para pegar o tipo de cadastro
            const submission = await db
                .selectFrom('submissions')
                .where('id', '=', submissionId)
                .select(['tipo_cadastro'])
                .executeTakeFirst();

            if (!submission) {
                return res.status(404).json({
                    success: false,
                    error: 'Submission não encontrada',
                });
            }

            const tipoCadastro = submission.tipo_cadastro || 'novo_cadastro';

            // Buscar templates para este tipo
            const templates = await db
                .selectFrom('checklist_templates')
                .where('tipo_cadastro', '=', tipoCadastro)
                .select(['item_nome', 'ordem', 'obrigatorio'])
                .orderBy('ordem', 'asc')
                .execute();

            // Verificar se já existe checklist para esta submission
            const existingItems = await db
                .selectFrom('checklists')
                .where('submission_id', '=', submissionId)
                .select(['id'])
                .execute();

            if (existingItems.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Checklist já foi inicializada para esta submission',
                });
            }

            // Criar itens de checklist baseados nos templates
            if (templates.length > 0) {
                const items = templates.map((template) => ({
                    submission_id: submissionId,
                    item_nome: template.item_nome,
                    completado: false,
                }));

                await db
                    .insertInto('checklists')
                    .values(items)
                    .execute();
            }

            // Buscar checklist criada
            const checklist = await db
                .selectFrom('checklists')
                .where('submission_id', '=', submissionId)
                .select([
                    'id',
                    'submission_id',
                    'item_nome',
                    'completado',
                    'completado_por',
                    'completado_em',
                    'observacao',
                    'created_at',
                ])
                .orderBy('created_at', 'asc')
                .execute();

            res.json({
                success: true,
                data: checklist,
                message: `Checklist inicializada com ${checklist.length} itens`,
            });
        } catch (error) {
            logger.error('Erro ao inicializar checklist:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao inicializar checklist',
            });
        }
    }
);

/**
 * POST /api/checklist/:submissionId/item
 * Adiciona item personalizado ao checklist
 */
router.post(
    '/:submissionId/item',
    requireAuth,
    requireAnyPermission('aprovarCadastros', 'viewDashboardCadastroGR'),
    async (req, res) => {
        try {
            const { submissionId } = req.params;
            const validation = criarItemSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Dados inválidos',
                    details: validation.error.errors,
                });
            }

            const { item_nome, observacao } = validation.data;

            // Verificar se a submission existe
            const submission = await db
                .selectFrom('submissions')
                .where('id', '=', submissionId)
                .select(['id'])
                .executeTakeFirst();

            if (!submission) {
                return res.status(404).json({
                    success: false,
                    error: 'Submission não encontrada',
                });
            }

            // Criar item
            const [item] = await db
                .insertInto('checklists')
                .values({
                    submission_id: submissionId,
                    item_nome,
                    observacao,
                    completado: false,
                })
                .returning([
                    'id',
                    'submission_id',
                    'item_nome',
                    'completado',
                    'observacao',
                    'created_at',
                ])
                .execute();

            res.json({
                success: true,
                data: item,
            });
        } catch (error) {
            logger.error('Erro ao adicionar item ao checklist:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao adicionar item',
            });
        }
    }
);

/**
 * PUT /api/checklist/item/:id/completar
 * Marca item como completo
 */
router.put(
    '/item/:id/completar',
    requireAuth,
    requireAnyPermission('aprovarCadastros', 'viewDashboardCadastroGR'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const authReq = req as AuthenticatedRequest;
            const user = authReq.user!;

            const validation = completarItemSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Dados inválidos',
                    details: validation.error.errors,
                });
            }

            const { observacao } = validation.data;

            // Atualizar item
            const [updated] = await db
                .updateTable('checklists')
                .set({
                    completado: true,
                    completado_por: user.id,
                    completado_em: new Date(),
                    observacao: observacao || undefined,
                })
                .where('id', '=', id)
                .returning([
                    'id',
                    'submission_id',
                    'item_nome',
                    'completado',
                    'completado_por',
                    'completado_em',
                    'observacao',
                ])
                .execute();

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    error: 'Item não encontrado',
                });
            }

            res.json({
                success: true,
                data: updated,
            });
        } catch (error) {
            logger.error('Erro ao completar item:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao completar item',
            });
        }
    }
);

/**
 * PUT /api/checklist/item/:id/desmarcar
 * Desmarca item como completo
 */
router.put(
    '/item/:id/desmarcar',
    requireAuth,
    requireAnyPermission('aprovarCadastros', 'viewDashboardCadastroGR'),
    async (req, res) => {
        try {
            const { id } = req.params;

            // Atualizar item
            const [updated] = await db
                .updateTable('checklists')
                .set({
                    completado: false,
                    completado_por: null,
                    completado_em: null,
                })
                .where('id', '=', id)
                .returning([
                    'id',
                    'submission_id',
                    'item_nome',
                    'completado',
                    'completado_por',
                    'completado_em',
                    'observacao',
                ])
                .execute();

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    error: 'Item não encontrado',
                });
            }

            res.json({
                success: true,
                data: updated,
            });
        } catch (error) {
            logger.error('Erro ao desmarcar item:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao desmarcar item',
            });
        }
    }
);

/**
 * DELETE /api/checklist/item/:id
 * Remove item do checklist
 */
router.delete(
    '/item/:id',
    requireAuth,
    requireAnyPermission('aprovarCadastros', 'viewDashboardCadastroGR'),
    async (req, res) => {
        try {
            const { id } = req.params;

            const result = await db
                .deleteFrom('checklists')
                .where('id', '=', id)
                .executeTakeFirst();

            if (result.numDeletedRows === BigInt(0)) {
                return res.status(404).json({
                    success: false,
                    error: 'Item não encontrado',
                });
            }

            res.json({
                success: true,
                message: 'Item removido com sucesso',
            });
        } catch (error) {
            logger.error('Erro ao remover item:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao remover item',
            });
        }
    }
);

/**
 * GET /api/checklist/:submissionId/progresso
 * Retorna progresso do checklist
 */
router.get(
    '/:submissionId/progresso',
    requireAuth,
    async (req, res) => {
        try {
            const { submissionId } = req.params;

            const items = await db
                .selectFrom('checklists')
                .where('submission_id', '=', submissionId)
                .select(['completado'])
                .execute();

            const total = items.length;
            const completados = items.filter((i) => i.completado).length;
            const percentual = total > 0 ? Math.round((completados / total) * 100) : 0;

            res.json({
                success: true,
                data: {
                    total,
                    completados,
                    pendentes: total - completados,
                    percentual,
                    completo: completados === total && total > 0,
                },
            });
        } catch (error) {
            logger.error('Erro ao buscar progresso:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar progresso',
            });
        }
    }
);

export default router;
