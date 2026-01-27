/**
 * Rotas da Fila de Cadastros (Submissions)
 * CRUD + workflow de aprovacao
 */
import { Router } from 'express';
import { z } from 'zod';
import { sql } from 'kysely';
import { db } from '../config/database.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requirePermission, requireAnyPermission } from '../middlewares/permission.middleware.js';
import { logger } from '../config/logger.js';
import { getIO, emitSubmissionDelay } from '../socket/index.js';
import type { AuthenticatedRequest } from '../types/api.js';
import type { SubmissionStatus, SubmissionPriority } from '../types/database.js';

const router = Router();

// Schema para criar submission
const createSubmissionSchema = z.object({
  nomeMotorista: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  cpf: z.string().min(11, 'CPF invalido'),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
  placa: z.string().optional(),
  tipoVeiculo: z.string().optional(),
  prioridade: z.enum(['normal', 'alta', 'urgente']).default('normal'),
  observacoes: z.string().optional(),
  origem: z.string().optional(),
  destino: z.string().optional(),
  localizacaoAtual: z.string().optional(),
  tipoMercadoria: z.string().optional(),
});

// Schema para atualizar submission
const updateSubmissionSchema = z.object({
  nomeMotorista: z.string().min(2).optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
  placa: z.string().optional(),
  tipoVeiculo: z.string().optional(),
  prioridade: z.enum(['normal', 'alta', 'urgente']).optional(),
  observacoes: z.string().optional(),
});

/**
 * GET /api/fila
 * Lista fila de cadastros
 */
router.get(
  '/',
  requireAuth,
  requireAnyPermission('viewDashboardCadastroGR', 'viewDashboardOperador', 'viewDashboardGestao'),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const {
        status,
        prioridade,
        operadorId,
        analistaId,
        search,
        page = '1',
        limit = '20',
      } = req.query;

      let query = db
        .selectFrom('submissions')
        .leftJoin('users as operador', 'submissions.operador_id', 'operador.id')
        .leftJoin('users as analista', 'submissions.analista_id', 'analista.id')
        .select([
          'submissions.id',
          'submissions.nome_motorista',
          'submissions.cpf',
          'submissions.telefone',
          'submissions.email',
          'submissions.placa',
          'submissions.tipo_veiculo',
          'submissions.status',
          'submissions.prioridade',
          'submissions.data_envio',
          'submissions.data_inicio_analise',
          'submissions.data_conclusao',
          'submissions.observacoes',
          'submissions.motivo_rejeicao',
          'submissions.created_at',
          'operador.nome as operador_nome',
          'operador.email as operador_email',
          'analista.nome as analista_nome',
          'analista.email as analista_email',
        ]);

      // Filtro por role do usuario
      if (authReq.user?.role === 'operacional') {
        // Operador so ve seus proprios cadastros
        query = query.where('submissions.operador_id', '=', authReq.user.id);
      }

      // Filtros
      if (status) {
        query = query.where('submissions.status', '=', status as SubmissionStatus);
      }

      if (prioridade) {
        query = query.where('submissions.prioridade', '=', prioridade as SubmissionPriority);
      }

      if (operadorId) {
        query = query.where('submissions.operador_id', '=', operadorId as string);
      }

      if (analistaId) {
        query = query.where('submissions.analista_id', '=', analistaId as string);
      }

      if (search && typeof search === 'string') {
        query = query.where((eb) =>
          eb.or([
            eb('submissions.nome_motorista', 'ilike', `%${search}%`),
            eb('submissions.cpf', 'ilike', `%${search}%`),
            eb('submissions.placa', 'ilike', `%${search}%`),
          ])
        );
      }

      // Contagem total
      const countQuery = db
        .selectFrom('submissions')
        .select(db.fn.count('id').as('count'));

      const [submissions, totalResult] = await Promise.all([
        query
          .orderBy('submissions.prioridade', 'desc')
          .orderBy('submissions.data_envio', 'asc')
          .limit(Number(limit))
          .offset((Number(page) - 1) * Number(limit))
          .execute(),
        countQuery.executeTakeFirst(),
      ]);

      const total = Number(totalResult?.count || 0);

      res.json({
        success: true,
        data: submissions,
        pagination: {
          total,
          page: Number(page),
          pageSize: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Erro ao listar fila:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao listar fila',
      });
    }
  }
);

/**
 * GET /api/fila/stats
 * Estatisticas da fila
 */
router.get(
  '/stats',
  requireAuth,
  requireAnyPermission('viewDashboardCadastroGR', 'viewDashboardGestao'),
  async (req, res) => {
    try {
      // Contagem por status
      const statusCounts = await db
        .selectFrom('submissions')
        .select([
          'status',
          db.fn.count('id').as('count'),
        ])
        .groupBy('status')
        .execute();

      // Tempo medio de analise (em minutos)
      const tempoMedio = await db
        .selectFrom('submissions')
        .select(
          sql<number>`AVG(EXTRACT(EPOCH FROM (data_conclusao - data_inicio_analise)) / 60)`.as('tempo_medio_minutos')
        )
        .where('data_conclusao', 'is not', null)
        .where('data_inicio_analise', 'is not', null)
        .executeTakeFirst();

      // Submissions hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const submissionsHoje = await db
        .selectFrom('submissions')
        .select(db.fn.count('id').as('count'))
        .where('data_envio', '>=', hoje)
        .executeTakeFirst();

      // Formatar resposta
      const stats = {
        pendentes: 0,
        emAnalise: 0,
        aprovados: 0,
        rejeitados: 0,
        total: 0,
        tempoMedioMinutos: Math.round(Number(tempoMedio?.tempo_medio_minutos) || 0),
        submissionsHoje: Number(submissionsHoje?.count || 0),
      };

      for (const row of statusCounts) {
        const count = Number(row.count);
        stats.total += count;

        switch (row.status) {
          case 'pendente':
            stats.pendentes = count;
            break;
          case 'em_analise':
            stats.emAnalise = count;
            break;
          case 'aprovado':
            stats.aprovados = count;
            break;
          case 'rejeitado':
            stats.rejeitados = count;
            break;
        }
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Erro ao buscar stats da fila:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar estatisticas',
      });
    }
  }
);

/**
 * GET /api/fila/:id
 * Detalhes de uma submission
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await db
      .selectFrom('submissions')
      .leftJoin('users as operador', 'submissions.operador_id', 'operador.id')
      .leftJoin('users as analista', 'submissions.analista_id', 'analista.id')
      .where('submissions.id', '=', id)
      .select([
        'submissions.id',
        'submissions.nome_motorista',
        'submissions.cpf',
        'submissions.telefone',
        'submissions.email',
        'submissions.placa',
        'submissions.tipo_veiculo',
        'submissions.status',
        'submissions.prioridade',
        'submissions.data_envio',
        'submissions.data_inicio_analise',
        'submissions.data_conclusao',
        'submissions.observacoes',
        'submissions.motivo_rejeicao',
        'submissions.created_at',
        'submissions.updated_at',
        'operador.id as operador_id',
        'operador.nome as operador_nome',
        'operador.email as operador_email',
        'analista.id as analista_id',
        'analista.nome as analista_nome',
        'analista.email as analista_email',
      ])
      .executeTakeFirst();

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission nao encontrada',
      });
    }

    // Buscar documentos relacionados
    const documents = await db
      .selectFrom('documents')
      .where('submission_id', '=', id)
      .select([
        'id',
        'tipo',
        'nome_original',
        'mime_type',
        'tamanho_bytes',
        'validado',
        'uploaded_at',
      ])
      .execute();

    res.json({
      success: true,
      data: {
        ...submission,
        documents,
      },
    });
  } catch (error) {
    logger.error('Erro ao buscar submission:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar submission',
    });
  }
});

/**
 * POST /api/fila
 * Cria nova submission
 */
router.post('/', requireAuth, requirePermission('criarCadastros'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = createSubmissionSchema.parse(req.body);

    const submission = await db
      .insertInto('submissions')
      .values({
        nome_motorista: data.nomeMotorista,
        cpf: data.cpf,
        telefone: data.telefone,
        email: data.email,
        placa: data.placa,
        tipo_veiculo: data.tipoVeiculo,
        prioridade: data.prioridade,
        observacoes: data.observacoes,
        origem: data.origem,
        destino: data.destino,
        localizacao_atual: data.localizacaoAtual,
        tipo_mercadoria: data.tipoMercadoria,
        operador_id: authReq.user!.id,
        status: 'pendente',
        data_envio: new Date(),
      })
      .returning([
        'id',
        'nome_motorista',
        'cpf',
        'status',
        'prioridade',
        'data_envio',
      ])
      .executeTakeFirst();

    logger.info(`Submission criada: ${submission?.id} por ${authReq.user?.email}`);

    res.status(201).json({
      success: true,
      data: submission,
      message: 'Cadastro enviado para fila',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados invalidos',
        details: error.errors,
      });
    }

    logger.error('Erro ao criar submission:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar cadastro',
    });
  }
});

/**
 * PUT /api/fila/:id
 * Atualiza submission
 */
router.put('/:id', requireAuth, requirePermission('editarCadastros'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const data = updateSubmissionSchema.parse(req.body);

    // Verificar se submission existe e pode ser editada
    const existing = await db
      .selectFrom('submissions')
      .where('id', '=', id)
      .select(['id', 'status'])
      .executeTakeFirst();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Submission nao encontrada',
      });
    }

    // Nao pode editar submissions ja aprovadas/rejeitadas
    if (existing.status === 'aprovado' || existing.status === 'rejeitado') {
      return res.status(400).json({
        success: false,
        error: 'Submission ja finalizada',
        message: 'Nao e possivel editar uma submission ja aprovada ou rejeitada',
      });
    }

    const updated = await db
      .updateTable('submissions')
      .set({
        ...(data.nomeMotorista && { nome_motorista: data.nomeMotorista }),
        ...(data.telefone !== undefined && { telefone: data.telefone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.placa !== undefined && { placa: data.placa }),
        ...(data.tipoVeiculo !== undefined && { tipo_veiculo: data.tipoVeiculo }),
        ...(data.prioridade && { prioridade: data.prioridade }),
        ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
      })
      .where('id', '=', id)
      .returning(['id', 'nome_motorista', 'status', 'updated_at'])
      .executeTakeFirst();

    logger.info(`Submission atualizada: ${id} por ${authReq.user?.email}`);

    res.json({
      success: true,
      data: updated,
      message: 'Cadastro atualizado',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados invalidos',
        details: error.errors,
      });
    }

    logger.error('Erro ao atualizar submission:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar cadastro',
    });
  }
});

/**
 * POST /api/fila/:id/analisar
 * Inicia analise de uma submission
 */
router.post('/:id/analisar', requireAuth, requirePermission('aprovarCadastros'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const existing = await db
      .selectFrom('submissions')
      .where('id', '=', id)
      .select(['id', 'status'])
      .executeTakeFirst();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Submission nao encontrada',
      });
    }

    if (existing.status !== 'pendente') {
      return res.status(400).json({
        success: false,
        error: 'Status invalido',
        message: 'Apenas submissions pendentes podem ser analisadas',
      });
    }

    const updated = await db
      .updateTable('submissions')
      .set({
        status: 'em_analise',
        analista_id: authReq.user!.id,
        data_inicio_analise: new Date(),
      })
      .where('id', '=', id)
      .returning(['id', 'status', 'data_inicio_analise'])
      .executeTakeFirst();

    logger.info(`Analise iniciada: ${id} por ${authReq.user?.email}`);

    res.json({
      success: true,
      data: updated,
      message: 'Analise iniciada',
    });
  } catch (error) {
    logger.error('Erro ao iniciar analise:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao iniciar analise',
    });
  }
});

/**
 * POST /api/fila/:id/aprovar
 * Aprova uma submission
 */
router.post('/:id/aprovar', requireAuth, requirePermission('aprovarCadastros'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { observacoes } = req.body;

    const existing = await db
      .selectFrom('submissions')
      .where('id', '=', id)
      .select(['id', 'status'])
      .executeTakeFirst();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Submission nao encontrada',
      });
    }

    if (existing.status !== 'em_analise' && existing.status !== 'pendente') {
      return res.status(400).json({
        success: false,
        error: 'Status invalido',
        message: 'Submission ja foi finalizada',
      });
    }

    const updated = await db
      .updateTable('submissions')
      .set({
        status: 'aprovado',
        analista_id: authReq.user!.id,
        data_conclusao: new Date(),
        ...(observacoes && { observacoes }),
      })
      .where('id', '=', id)
      .returning(['id', 'status', 'data_conclusao'])
      .executeTakeFirst();

    logger.info(`Submission aprovada: ${id} por ${authReq.user?.email}`);

    res.json({
      success: true,
      data: updated,
      message: 'Cadastro aprovado com sucesso',
    });
  } catch (error) {
    logger.error('Erro ao aprovar submission:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao aprovar cadastro',
    });
  }
});

/**
 * POST /api/fila/:id/rejeitar
 * Rejeita uma submission
 */
router.post('/:id/rejeitar', requireAuth, requirePermission('aprovarCadastros'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { motivoRejeicao } = req.body;

    if (!motivoRejeicao) {
      return res.status(400).json({
        success: false,
        error: 'Motivo obrigatorio',
        message: 'Informe o motivo da rejeicao',
      });
    }

    const existing = await db
      .selectFrom('submissions')
      .where('id', '=', id)
      .select(['id', 'status'])
      .executeTakeFirst();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Submission nao encontrada',
      });
    }

    if (existing.status !== 'em_analise' && existing.status !== 'pendente') {
      return res.status(400).json({
        success: false,
        error: 'Status invalido',
        message: 'Submission ja foi finalizada',
      });
    }

    const updated = await db
      .updateTable('submissions')
      .set({
        status: 'rejeitado',
        analista_id: authReq.user!.id,
        data_conclusao: new Date(),
        motivo_rejeicao: motivoRejeicao,
        ...(req.body.categoria && { categoria_rejeicao: req.body.categoria }),
      })
      .where('id', '=', id)
      .returning(['id', 'status', 'motivo_rejeicao', 'categoria_rejeicao', 'data_conclusao'])
      .executeTakeFirst();

    logger.info(`Submission rejeitada: ${id} por ${authReq.user?.email} - Categoria: ${req.body.categoria || 'N/A'}`);

    res.json({
      success: true,
      data: updated,
      message: 'Cadastro rejeitado',
    });
  } catch (error) {
    logger.error('Erro ao rejeitar submission:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao rejeitar cadastro',
    });
  }
});

/**
 * POST /api/fila/:id/adicionar-atraso
 * Adiciona motivo de atraso a uma submission
 */
router.post('/:id/adicionar-atraso', requireAuth, requirePermission('aprovarCadastros'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo || typeof motivo !== 'string' || motivo.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Motivo obrigatorio',
        message: 'Informe o motivo do atraso',
      });
    }

    // Verificar se submission existe
    const submission = await db
      .selectFrom('submissions')
      .where('id', '=', id)
      .select(['id', 'status', 'operador_id'])
      .executeTakeFirst();

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission nao encontrada',
      });
    }

    // Criar registro de atraso
    const delay = await db
      .insertInto('delays')
      .values({
        submission_id: id,
        motivo: motivo.trim(),
        criado_por: authReq.user!.id,
        criado_em: new Date(),
        notificado: false,
      })
      .returning(['id', 'submission_id', 'motivo', 'criado_em'])
      .executeTakeFirst();

    logger.info(`Atraso adicionado: ${delay?.id} para submission ${id} por ${authReq.user?.email}`);

    // Emitir evento Socket.IO para notificar operador em tempo real
    try {
      const io = getIO();
      if (delay) {
        emitSubmissionDelay(
          io,
          {
            submissionId: id,
            delay: {
              id: delay.id,
              motivo: delay.motivo,
              criado_em: delay.criado_em,
              criado_por_nome: authReq.user?.nome,
            },
          },
          submission.operador_id
        );
      }
    } catch (error) {
      logger.warn('Socket.IO nao disponivel para emitir evento de delay:', error);
    }

    res.status(201).json({
      success: true,
      data: delay,
      message: 'Atraso registrado. Operador sera notificado.',
    });
  } catch (error) {
    logger.error('Erro ao adicionar atraso:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao registrar atraso',
    });
  }
});

/**
 * GET /api/fila/:id/delays
 * Lista atrasos de uma submission
 */
router.get('/:id/delays', requireAuth, requireAnyPermission('viewDashboardCadastroGR', 'viewDashboardOperador'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se submission existe
    const submission = await db
      .selectFrom('submissions')
      .where('id', '=', id)
      .select('id')
      .executeTakeFirst();

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission nao encontrada',
      });
    }

    // Buscar delays com informacoes do criador
    const delays = await db
      .selectFrom('delays')
      .leftJoin('users', 'delays.criado_por', 'users.id')
      .where('delays.submission_id', '=', id)
      .select([
        'delays.id',
        'delays.submission_id',
        'delays.motivo',
        'delays.criado_em',
        'delays.notificado',
        'delays.notificado_em',
        'users.nome as criado_por_nome',
        'users.email as criado_por_email',
      ])
      .orderBy('delays.criado_em', 'desc')
      .execute();

    res.json({
      success: true,
      data: delays,
    });
  } catch (error) {
    logger.error('Erro ao buscar delays:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar atrasos',
    });
  }
});

export default router;
