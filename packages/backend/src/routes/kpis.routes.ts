/**
 * Rotas de KPIs e Métricas
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { db } from '../config/database.js';

const router = Router();

/**
 * GET /api/kpis/summary
 * Resumo de KPIs do sistema
 */
router.get('/summary', authenticate, requirePermission('viewDashboardGestao'), asyncHandler(async (req: Request, res: Response) => {
    // Estatísticas de submissões
    const submissionStats = await db
        .selectFrom('submissions')
        .select([
            db.fn.count('id').as('total'),
            db.raw(`COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes`),
            db.raw(`COUNT(CASE WHEN status = 'em_analise' THEN 1 END) as em_analise`),
            db.raw(`COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados`),
            db.raw(`COUNT(CASE WHEN status = 'rejeitado' THEN 1 END) as rejeitados`),
        ])
        .executeTakeFirst();

    // Estatísticas de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await db
        .selectFrom('submissions')
        .select([
            db.fn.count('id').as('total_hoje'),
            db.raw(`COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados_hoje`),
        ])
        .where('created_at', '>=', today)
        .executeTakeFirst();

    // Usuários ativos
    const activeUsers = await db
        .selectFrom('users')
        .select(db.fn.count('id').as('count'))
        .where('ativo', '=', true)
        .executeTakeFirst();

    // Documentos enviados
    const docCount = await db
        .selectFrom('documents')
        .select(db.fn.count('id').as('count'))
        .executeTakeFirst();

    res.json({
        success: true,
        data: {
            submissions: {
                total: Number(submissionStats?.total || 0),
                pendentes: Number(submissionStats?.pendentes || 0),
                em_analise: Number(submissionStats?.em_analise || 0),
                aprovados: Number(submissionStats?.aprovados || 0),
                rejeitados: Number(submissionStats?.rejeitados || 0),
            },
            today: {
                total: Number(todayStats?.total_hoje || 0),
                aprovados: Number(todayStats?.aprovados_hoje || 0),
            },
            users: {
                active: Number(activeUsers?.count || 0),
            },
            documents: {
                total: Number(docCount?.count || 0),
            },
        },
    });
}));

/**
 * GET /api/kpis/cadastros
 * Estatísticas detalhadas de cadastros
 */
router.get('/cadastros', authenticate, requirePermission('viewDashboardCadastroGR'), asyncHandler(async (req: Request, res: Response) => {
    // Por operador
    const byOperator = await db
        .selectFrom('submissions as s')
        .innerJoin('users as u', 'u.id', 's.operador_id')
        .select([
            'u.name as operador',
            db.fn.count('s.id').as('total'),
            db.raw(`COUNT(CASE WHEN s.status = 'aprovado' THEN 1 END) as aprovados`),
        ])
        .groupBy('u.id')
        .groupBy('u.name')
        .orderBy(db.fn.count('s.id'), 'desc')
        .limit(10)
        .execute();

    // Por prioridade
    const byPriority = await db
        .selectFrom('submissions')
        .select([
            'prioridade',
            db.fn.count('id').as('count'),
        ])
        .groupBy('prioridade')
        .execute();

    // Tempo médio de processamento (aprovados)
    const avgTime = await db
        .selectFrom('submissions')
        .select(
            db.raw(`AVG(EXTRACT(EPOCH FROM (finished_at - created_at))/60) as avg_minutes`)
        )
        .where('status', '=', 'aprovado')
        .where('finished_at', 'is not', null)
        .executeTakeFirst();

    res.json({
        success: true,
        data: {
            byOperator,
            byPriority,
            avgProcessingTime: Math.round(Number(avgTime?.avg_minutes || 0)),
        },
    });
}));

export default router;
