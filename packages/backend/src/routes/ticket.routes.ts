/**
 * Rotas de Tickets de Suporte
 * CRUD completo com persistência em PostgreSQL
 */
import { Router, Response } from 'express';
import { db } from '../config/database.js';
import { logger } from '../config/logger.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import type { AuthenticatedRequest } from '../types/api.js';
import type { TicketStatus } from '../types/database.js';

const router = Router();

/**
 * POST /api/tickets
 * Cria um novo ticket de suporte (requer autenticação)
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { titulo, categoria, descricao } = req.body;
        const user = req.user!;

        // Validação
        if (!titulo || !titulo.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Título é obrigatório',
            });
        }

        if (!descricao || !descricao.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Descrição é obrigatória',
            });
        }

        const categoriasValidas = ['bug', 'duvida', 'sugestao', 'outro'];
        if (!categoria || !categoriasValidas.includes(categoria)) {
            return res.status(400).json({
                success: false,
                error: 'Categoria inválida',
            });
        }

        // Criar ticket no banco
        const ticket = await db
            .insertInto('tickets')
            .values({
                titulo: titulo.trim(),
                categoria,
                descricao: descricao.trim(),
                usuario_id: user.id,
                usuario_nome: user.nome,
                usuario_email: user.email,
            })
            .returningAll()
            .executeTakeFirstOrThrow();

        logger.info('========================================');
        logger.info('🎫 NOVO TICKET DE SUPORTE RECEBIDO');
        logger.info(`ID: ${ticket.id}`);
        logger.info(`Título: ${ticket.titulo}`);
        logger.info(`Categoria: ${ticket.categoria}`);
        logger.info(`Usuário: ${user.nome} (${user.email})`);
        logger.info('========================================');

        return res.status(201).json({
            success: true,
            message: 'Ticket criado com sucesso! Nossa equipe irá analisar em breve.',
            data: ticket,
        });
    } catch (error) {
        logger.error('Erro ao criar ticket:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno ao criar ticket',
        });
    }
});

/**
 * GET /api/tickets
 * Lista tickets - admin vê todos, usuário comum vê apenas os seus
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user!;
        const { status, categoria, page = '1', limit = '20' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
        const offset = (pageNum - 1) * limitNum;

        let query = db.selectFrom('tickets');
        let countQuery = db.selectFrom('tickets');

        // Admins/gestores veem todos; outros veem apenas os seus
        if (user.role !== 'admin' && user.role !== 'gestor') {
            query = query.where('usuario_id', '=', user.id);
            countQuery = countQuery.where('usuario_id', '=', user.id);
        }

        // Filtros
        if (status && typeof status === 'string') {
            query = query.where('status', '=', status as TicketStatus);
            countQuery = countQuery.where('status', '=', status as TicketStatus);
        }

        if (categoria && typeof categoria === 'string') {
            query = query.where('categoria', '=', categoria as any);
            countQuery = countQuery.where('categoria', '=', categoria as any);
        }

        // Contagem total
        const totalResult = await countQuery
            .select(db.fn.count('id').as('total'))
            .executeTakeFirst();
        const total = Number(totalResult?.total || 0);

        // Buscar tickets
        const tickets = await query
            .selectAll()
            .orderBy('created_at', 'desc')
            .limit(limitNum)
            .offset(offset)
            .execute();

        return res.json({
            success: true,
            data: tickets,
            pagination: {
                total,
                page: pageNum,
                pageSize: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        logger.error('Erro ao listar tickets:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno ao listar tickets',
        });
    }
});

/**
 * GET /api/tickets/stats/summary
 * Estatísticas dos tickets (admin/gestor)
 * IMPORTANTE: Deve estar antes de /:id para não ser capturado pelo param
 */
router.get('/stats/summary', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user!;

        if (user.role !== 'admin' && user.role !== 'gestor') {
            return res.status(403).json({
                success: false,
                error: 'Sem permissão',
            });
        }

        // Buscar contagens por status
        const byStatus = await db
            .selectFrom('tickets')
            .select(['status', db.fn.count('id').as('count')])
            .groupBy('status')
            .execute();

        const byCategoria = await db
            .selectFrom('tickets')
            .select(['categoria', db.fn.count('id').as('count')])
            .groupBy('categoria')
            .execute();

        const statusMap = byStatus.reduce((acc, row) => {
            acc[row.status] = Number(row.count);
            return acc;
        }, {} as Record<string, number>);

        const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

        return res.json({
            success: true,
            data: {
                total,
                byStatus: statusMap,
                byCategoria: byCategoria.reduce((acc, row) => {
                    acc[row.categoria] = Number(row.count);
                    return acc;
                }, {} as Record<string, number>),
            },
        });
    } catch (error) {
        logger.error('Erro ao buscar estatísticas de tickets:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno',
        });
    }
});

/**
 * GET /api/tickets/:id
 * Detalhes de um ticket específico
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user!;
        const { id } = req.params;

        const ticket = await db
            .selectFrom('tickets')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst();

        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: 'Ticket não encontrado',
            });
        }

        // Verificar permissão
        if (user.role !== 'admin' && user.role !== 'gestor' && ticket.usuario_id !== user.id) {
            return res.status(403).json({
                success: false,
                error: 'Sem permissão para visualizar este ticket',
            });
        }

        return res.json({
            success: true,
            data: ticket,
        });
    } catch (error) {
        logger.error('Erro ao buscar ticket:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno ao buscar ticket',
        });
    }
});

/**
 * PUT /api/tickets/:id/status
 * Atualiza o status de um ticket (admin/gestor)
 */
router.put('/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user!;

        if (user.role !== 'admin' && user.role !== 'gestor') {
            return res.status(403).json({
                success: false,
                error: 'Sem permissão para alterar status do ticket',
            });
        }

        const { id } = req.params;
        const { status } = req.body;

        const statusValidos = ['aberto', 'em_andamento', 'resolvido', 'fechado'];
        if (!status || !statusValidos.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Status inválido',
            });
        }

        const ticket = await db
            .updateTable('tickets')
            .set({ status })
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirst();

        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: 'Ticket não encontrado',
            });
        }

        logger.info(`Ticket ${id} atualizado para status: ${status} por ${user.nome}`);

        return res.json({
            success: true,
            data: ticket,
        });
    } catch (error) {
        logger.error('Erro ao atualizar status do ticket:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno ao atualizar ticket',
        });
    }
});

/**
 * PUT /api/tickets/:id/responder
 * Responde a um ticket (admin/gestor)
 */
router.put('/:id/responder', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user!;

        if (user.role !== 'admin' && user.role !== 'gestor') {
            return res.status(403).json({
                success: false,
                error: 'Sem permissão para responder tickets',
            });
        }

        const { id } = req.params;
        const { resposta, status } = req.body;

        if (!resposta || !resposta.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Resposta é obrigatória',
            });
        }

        const updateData: Record<string, any> = {
            resposta: resposta.trim(),
            respondido_por: user.id,
            respondido_em: new Date(),
        };

        // Se enviou status junto, atualiza também
        if (status) {
            const statusValidos = ['aberto', 'em_andamento', 'resolvido', 'fechado'];
            if (statusValidos.includes(status)) {
                updateData.status = status;
            }
        } else {
            // Default: marcar como resolvido ao responder
            updateData.status = 'resolvido';
        }

        const ticket = await db
            .updateTable('tickets')
            .set(updateData)
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirst();

        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: 'Ticket não encontrado',
            });
        }

        logger.info(`Ticket ${id} respondido por ${user.nome}`);

        return res.json({
            success: true,
            data: ticket,
            message: 'Ticket respondido com sucesso',
        });
    } catch (error) {
        logger.error('Erro ao responder ticket:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno ao responder ticket',
        });
    }
});

/**
 * DELETE /api/tickets/:id
 * Remove um ticket (admin apenas)
 */
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user!;

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Apenas administradores podem deletar tickets',
            });
        }

        const { id } = req.params;

        const result = await db
            .deleteFrom('tickets')
            .where('id', '=', id)
            .executeTakeFirst();

        if (!result.numDeletedRows) {
            return res.status(404).json({
                success: false,
                error: 'Ticket não encontrado',
            });
        }

        logger.info(`Ticket ${id} deletado por ${user.nome}`);

        return res.json({
            success: true,
            message: 'Ticket deletado com sucesso',
        });
    } catch (error) {
        logger.error('Erro ao deletar ticket:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno ao deletar ticket',
        });
    }
});

export default router;
