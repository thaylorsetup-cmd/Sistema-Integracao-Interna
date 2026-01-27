/**
 * Rotas do Dashboard
 * Estatisticas e KPIs
 */
import { Router } from 'express';
import { sql } from 'kysely';
import { db } from '../config/database.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireAnyPermission } from '../middlewares/permission.middleware.js';
import { logger } from '../config/logger.js';
import type { AuthenticatedRequest } from '../types/api.js';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Estatisticas gerais do dashboard
 */
router.get(
  '/stats',
  requireAuth,
  requireAnyPermission('viewDashboardGestao', 'viewDashboardCadastroGR'),
  async (req, res) => {
    try {
      // Stats da fila
      const filaStats = await db
        .selectFrom('submissions')
        .select([
          db.fn.count('id').as('total'),
          db.fn
            .count('id')
            .filterWhere('status', '=', 'pendente')
            .as('pendentes'),
          db.fn
            .count('id')
            .filterWhere('status', '=', 'em_analise')
            .as('em_analise'),
          db.fn
            .count('id')
            .filterWhere('status', '=', 'aprovado')
            .as('aprovados'),
          db.fn
            .count('id')
            .filterWhere('status', '=', 'rejeitado')
            .as('rejeitados'),
        ])
        .executeTakeFirst();

      // Tempo medio de processamento
      const tempoMedio = await db
        .selectFrom('submissions')
        .select(
          sql<number>`AVG(EXTRACT(EPOCH FROM (data_conclusao - data_inicio_analise)) / 60)`.as('tempo_medio_minutos')
        )
        .where('data_conclusao', 'is not', null)
        .where('data_inicio_analise', 'is not', null)
        .executeTakeFirst();

      // Stats de documentos
      const docStats = await db
        .selectFrom('documents')
        .select([
          db.fn.count('id').as('total'),
          db.fn.sum('tamanho_bytes').as('tamanho_total'),
        ])
        .executeTakeFirst();

      // Documentos por tipo
      const docsPorTipo = await db
        .selectFrom('documents')
        .select(['tipo', db.fn.count('id').as('count')])
        .groupBy('tipo')
        .execute();

      // Stats de usuarios
      const userStats = await db
        .selectFrom('users')
        .select([
          db.fn.count('id').as('total'),
          db.fn.count('id').filterWhere('ativo', '=', true).as('ativos'),
        ])
        .executeTakeFirst();

      // Usuarios por role
      const usersPorRole = await db
        .selectFrom('users')
        .select(['role', db.fn.count('id').as('count')])
        .groupBy('role')
        .execute();

      // Formatar resposta
      const stats = {
        fila: {
          total: Number(filaStats?.total || 0),
          pendentes: Number(filaStats?.pendentes || 0),
          emAnalise: Number(filaStats?.em_analise || 0),
          aprovados: Number(filaStats?.aprovados || 0),
          rejeitados: Number(filaStats?.rejeitados || 0),
          tempoMedioMinutos: Math.round(Number(tempoMedio?.tempo_medio_minutos) || 0),
        },
        documentos: {
          total: Number(docStats?.total || 0),
          tamanhoTotalBytes: Number(docStats?.tamanho_total || 0),
          porTipo: docsPorTipo.reduce(
            (acc, row) => ({
              ...acc,
              [row.tipo]: Number(row.count),
            }),
            {} as Record<string, number>
          ),
        },
        usuarios: {
          total: Number(userStats?.total || 0),
          ativos: Number(userStats?.ativos || 0),
          porRole: usersPorRole.reduce(
            (acc, row) => ({
              ...acc,
              [row.role]: Number(row.count),
            }),
            {} as Record<string, number>
          ),
        },
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Erro ao buscar stats do dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar estatisticas',
      });
    }
  }
);

/**
 * GET /api/dashboard/submissions-por-dia
 * Submissions por dia (ultimos 30 dias)
 */
router.get(
  '/submissions-por-dia',
  requireAuth,
  requireAnyPermission('viewDashboardGestao', 'viewDashboardCadastroGR'),
  async (req, res) => {
    try {
      const { dias = '30' } = req.query;

      const numDias = Number(dias);
      const result = await db
        .selectFrom('submissions')
        .select([
          sql<string>`DATE(data_envio)`.as('data'),
          db.fn.count('id').as('total'),
          db.fn
            .count('id')
            .filterWhere('status', '=', 'aprovado')
            .as('aprovados'),
          db.fn
            .count('id')
            .filterWhere('status', '=', 'rejeitado')
            .as('rejeitados'),
        ])
        .where(
          'data_envio',
          '>=',
          sql<Date>`NOW() - INTERVAL '${sql.raw(String(numDias))} days'`
        )
        .groupBy(sql`DATE(data_envio)`)
        .orderBy(sql`DATE(data_envio)`, 'asc')
        .execute();

      res.json({
        success: true,
        data: result.map((row) => ({
          data: row.data,
          total: Number(row.total),
          aprovados: Number(row.aprovados),
          rejeitados: Number(row.rejeitados),
        })),
      });
    } catch (error) {
      logger.error('Erro ao buscar submissions por dia:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar dados',
      });
    }
  }
);

/**
 * GET /api/dashboard/top-operadores
 * Operadores com mais submissions
 */
router.get(
  '/top-operadores',
  requireAuth,
  requireAnyPermission('viewDashboardGestao'),
  async (req, res) => {
    try {
      const { limit = '10' } = req.query;

      const result = await db
        .selectFrom('submissions')
        .innerJoin('users', 'submissions.operador_id', 'users.id')
        .select([
          'users.id',
          'users.nome',
          'users.email',
          db.fn.count('submissions.id').as('total_submissions'),
          db.fn
            .count('submissions.id')
            .filterWhere('submissions.status', '=', 'aprovado')
            .as('aprovados'),
        ])
        .groupBy(['users.id', 'users.nome', 'users.email'])
        .orderBy(db.fn.count('submissions.id'), 'desc')
        .limit(Number(limit))
        .execute();

      res.json({
        success: true,
        data: result.map((row) => ({
          id: row.id,
          nome: row.nome,
          email: row.email,
          totalSubmissions: Number(row.total_submissions),
          aprovados: Number(row.aprovados),
          taxaAprovacao:
            Number(row.total_submissions) > 0
              ? Math.round(
                  (Number(row.aprovados) / Number(row.total_submissions)) * 100
                )
              : 0,
        })),
      });
    } catch (error) {
      logger.error('Erro ao buscar top operadores:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar dados',
      });
    }
  }
);

/**
 * GET /api/dashboard/meu-resumo
 * Resumo do usuario logado
 */
router.get('/meu-resumo', requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    // Minhas submissions (se for operador)
    const minhasSubmissions = await db
      .selectFrom('submissions')
      .where('operador_id', '=', userId)
      .select([
        db.fn.count('id').as('total'),
        db.fn
          .count('id')
          .filterWhere('status', '=', 'pendente')
          .as('pendentes'),
        db.fn
          .count('id')
          .filterWhere('status', '=', 'aprovado')
          .as('aprovados'),
        db.fn
          .count('id')
          .filterWhere('status', '=', 'rejeitado')
          .as('rejeitados'),
      ])
      .executeTakeFirst();

    // Minhas analises (se for analista)
    const minhasAnalises = await db
      .selectFrom('submissions')
      .where('analista_id', '=', userId)
      .select([
        db.fn.count('id').as('total'),
        db.fn
          .count('id')
          .filterWhere('status', '=', 'aprovado')
          .as('aprovados'),
        db.fn
          .count('id')
          .filterWhere('status', '=', 'rejeitado')
          .as('rejeitados'),
      ])
      .executeTakeFirst();

    // Submissions hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const submissionsHoje = await db
      .selectFrom('submissions')
      .where('operador_id', '=', userId)
      .where('data_envio', '>=', hoje)
      .select(db.fn.count('id').as('count'))
      .executeTakeFirst();

    res.json({
      success: true,
      data: {
        minhasSubmissions: {
          total: Number(minhasSubmissions?.total || 0),
          pendentes: Number(minhasSubmissions?.pendentes || 0),
          aprovados: Number(minhasSubmissions?.aprovados || 0),
          rejeitados: Number(minhasSubmissions?.rejeitados || 0),
        },
        minhasAnalises: {
          total: Number(minhasAnalises?.total || 0),
          aprovados: Number(minhasAnalises?.aprovados || 0),
          rejeitados: Number(minhasAnalises?.rejeitados || 0),
        },
        submissionsHoje: Number(submissionsHoje?.count || 0),
      },
    });
  } catch (error) {
    logger.error('Erro ao buscar meu resumo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar resumo',
    });
  }
});

/**
 * GET /api/dashboard/delay-stats
 * Estatisticas de atrasos
 */
router.get(
  '/delay-stats',
  requireAuth,
  requireAnyPermission('viewDashboardGestao', 'viewDashboardCadastroGR'),
  async (req, res) => {
    try {
      // Total de atrasos
      const totalDelays = await db
        .selectFrom('delays')
        .select(db.fn.count('id').as('count'))
        .executeTakeFirst();

      // Submissions com atrasos
      const submissionsComAtrasos = await db
        .selectFrom('delays')
        .select(sql<number>`COUNT(DISTINCT submission_id)`.as('count'))
        .executeTakeFirst();

      // Media de atrasos por submission
      const avgDelays = await sql<{ avg: number }>`
        SELECT AVG(delays_count) as avg FROM (
          SELECT submission_id, COUNT(id) as delays_count
          FROM delays
          GROUP BY submission_id
        ) counts
      `.execute(db).then(r => r.rows[0]);

      // Top motivos de atraso
      const topDelayReasons = await db
        .selectFrom('delays')
        .select(['motivo', db.fn.count('id').as('count')])
        .groupBy('motivo')
        .orderBy(db.fn.count('id'), 'desc')
        .limit(10)
        .execute();

      res.json({
        success: true,
        data: {
          totalDelays: Number(totalDelays?.count || 0),
          submissionsWithDelays: Number(submissionsComAtrasos?.count || 0),
          averageDelaysPerSubmission: Number(avgDelays?.avg || 0).toFixed(2),
          topDelayReasons: topDelayReasons.map((row) => ({
            motivo: row.motivo,
            count: Number(row.count),
          })),
        },
      });
    } catch (error) {
      logger.error('Erro ao buscar delay stats:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar estatisticas de atrasos',
      });
    }
  }
);

/**
 * GET /api/dashboard/audit-metrics
 * Metricas para dashboard de auditoria
 */
router.get(
  '/audit-metrics',
  requireAuth,
  requireAnyPermission('viewAuditoria'),
  async (req, res) => {
    try {
      const { operador, submissionId } = req.query;

      // Base query para filtros
      let submissionsQuery = db.selectFrom('submissions');

      if (operador && typeof operador === 'string') {
        submissionsQuery = submissionsQuery
          .innerJoin('users', 'submissions.operador_id', 'users.id')
          .where('users.nome', 'ilike', `%${operador}%`);
      }

      if (submissionId && typeof submissionId === 'string') {
        submissionsQuery = submissionsQuery.where('submissions.id', '=', submissionId);
      }

      // Total de submissions
      const totalSubmissions = await submissionsQuery
        .select(db.fn.count('submissions.id').as('count'))
        .executeTakeFirst();

      // Taxa de aprovacao
      const approved = await submissionsQuery
        .select(db.fn.count('submissions.id').as('count'))
        .where('status', '=', 'aprovado')
        .executeTakeFirst();

      // Tempo medio de processamento (em horas)
      const avgProcessingTime = await submissionsQuery
        .select(
          sql<number>`AVG(EXTRACT(EPOCH FROM (data_conclusao - data_inicio_analise)) / 3600)`.as('avg_hours')
        )
        .where('data_conclusao', 'is not', null)
        .where('data_inicio_analise', 'is not', null)
        .executeTakeFirst();

      // Rejeicoes por categoria
      const rejectionsByCategory = await db
        .selectFrom('submissions')
        .where('status', '=', 'rejeitado')
        .where('categoria_rejeicao', 'is not', null)
        .select(['categoria_rejeicao', db.fn.count('id').as('count')])
        .groupBy('categoria_rejeicao')
        .execute();

      // Total de atrasos
      const delayCount = await db
        .selectFrom('delays')
        .select(db.fn.count('id').as('count'))
        .executeTakeFirst();

      // Operadores mais ativos
      const mostActiveOperators = await db
        .selectFrom('submissions')
        .innerJoin('users', 'submissions.operador_id', 'users.id')
        .select([
          'users.id',
          'users.nome',
          db.fn.count('submissions.id').as('total'),
          db.fn
            .count('submissions.id')
            .filterWhere('submissions.status', '=', 'aprovado')
            .as('aprovados'),
        ])
        .groupBy(['users.id', 'users.nome'])
        .orderBy(db.fn.count('submissions.id'), 'desc')
        .limit(10)
        .execute();

      const total = Number(totalSubmissions?.count || 0);
      const approvalRate = total > 0
        ? Math.round((Number(approved?.count || 0) / total) * 100)
        : 0;

      res.json({
        success: true,
        data: {
          totalSubmissions: total,
          approvalRate,
          averageProcessingTime: Number(avgProcessingTime?.avg_hours || 0).toFixed(1),
          rejectionsByCategory: rejectionsByCategory.reduce(
            (acc, row) => ({
              ...acc,
              [row.categoria_rejeicao || 'outros']: Number(row.count),
            }),
            {} as Record<string, number>
          ),
          delayCount: Number(delayCount?.count || 0),
          mostActiveOperators: mostActiveOperators.map((row) => ({
            id: row.id,
            nome: row.nome,
            total: Number(row.total),
            aprovados: Number(row.aprovados),
            taxaAprovacao:
              Number(row.total) > 0
                ? Math.round((Number(row.aprovados) / Number(row.total)) * 100)
                : 0,
          })),
        },
      });
    } catch (error) {
      logger.error('Erro ao buscar audit metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar metricas de auditoria',
      });
    }
  }
);

export default router;
