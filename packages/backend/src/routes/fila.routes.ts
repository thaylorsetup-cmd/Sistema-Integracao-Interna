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

const router: Router = Router();

// Schema para criar submission
const createSubmissionSchema = z.object({
  // Dados básicos
  nomeMotorista: z.string().min(2, 'Nome deve ter no minimo 2 caracteres').optional(),
  cpf: z.string().min(11, 'CPF invalido').optional(),
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

  // Tipo de cadastro (migration 011)
  tipoCadastro: z.enum(['novo_cadastro', 'atualizacao', 'agregado', 'bens_rodando']).default('novo_cadastro'),

  // Campos adicionais para Cadastro Novo (migration 011)
  telProprietario: z.string().optional(),
  enderecoResidencial: z.string().optional(),
  numeroPis: z.string().optional(),
  valorMercadoria: z.number().optional(),
  telMotorista: z.string().optional(),
  referenciaComercial1: z.string().optional(),
  referenciaComercial2: z.string().optional(),
  referenciaPessoal1: z.string().optional(),
  referenciaPessoal2: z.string().optional(),
  referenciaPessoal3: z.string().optional(),

  // Rastreamento
  requerRastreamento: z.boolean().default(false),
  coordenadasRastreamento: z.record(z.unknown()).optional(),
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
        verTodos,
        dataInicio,
        dataFim,
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
          'submissions.categoria_rejeicao',
          'submissions.tipo_cadastro',
          'submissions.devolvido_em',
          'submissions.devolvido_por',
          'submissions.updated_at',
          'submissions.created_at',
          'operador.id as operador_id',
          'operador.nome as operador_nome',
          'operador.email as operador_email',
          'analista.nome as analista_nome',
          'analista.email as analista_email',
          'submissions.origem',
          'submissions.destino',
          'submissions.valor_mercadoria',
          'submissions.tipo_mercadoria',
          'submissions.tel_motorista',
          'submissions.tel_proprietario',
          'submissions.numero_pis',
          'submissions.endereco_residencial',
          'submissions.referencia_comercial_1',
          'submissions.referencia_comercial_2',
          'submissions.referencia_pessoal_1',
          'submissions.referencia_pessoal_2',
          'submissions.referencia_pessoal_3',
        ]);

      // Filtro por role do usuario
      if (authReq.user?.role === 'operacional') {
        // Operador so ve seus proprios cadastros
        query = query.where('submissions.operador_id', '=', authReq.user.id);
      }

      // Filtros de Data
      // Por padrao, mostra apenas submissions de HOJE, a menos que verTodos=true seja passado
      // Isso atende ao requisito: "todo dia tem que atualizar, sumir os de ontem e atualizar só o que for recebido hoje"
      if (verTodos !== 'true') {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // Inicio do dia local do servidor

        if (dataInicio && typeof dataInicio === 'string') {
          const dtInicio = new Date(dataInicio);
          query = query.where('submissions.data_envio', '>=', dtInicio);
        } else if (!search) {
          // Se nao houver busca nem data especifica, aplica filtro de hoje
          // Se houver busca (search), ignoramos o filtro de data padrão para procurar em tudo
          query = query.where('submissions.data_envio', '>=', hoje);
        }

        if (dataFim && typeof dataFim === 'string') {
          const dtFim = new Date(dataFim);
          dtFim.setHours(23, 59, 59, 999);
          query = query.where('submissions.data_envio', '<=', dtFim);
        }
      }

      // Filtros padrao
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
        // Busca textual
        query = query.where((eb) =>
          eb.or([
            eb('submissions.nome_motorista', 'ilike', `%${search}%`),
            eb('submissions.cpf', 'ilike', `%${search}%`),
            eb('submissions.placa', 'ilike', `%${search}%`),
          ])
        );
      }

      // Count query construction
      let countQuery = db
        .selectFrom('submissions')
        .select(db.fn.count('id').as('count'));

      // Re-apply filters to countQuery
      if (authReq.user?.role === 'operacional') {
        countQuery = countQuery.where('operador_id', '=', authReq.user.id);
      }

      // Re-apply date Logic to Count
      if (verTodos !== 'true') {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        if (dataInicio && typeof dataInicio === 'string') {
          const dtInicio = new Date(dataInicio);
          countQuery = countQuery.where('data_envio', '>=', dtInicio);
        } else if (!search) {
          countQuery = countQuery.where('data_envio', '>=', hoje);
        }

        if (dataFim && typeof dataFim === 'string') {
          const dtFim = new Date(dataFim);
          dtFim.setHours(23, 59, 59, 999);
          countQuery = countQuery.where('data_envio', '<=', dtFim);
        }
      }

      if (status) {
        countQuery = countQuery.where('status', '=', status as SubmissionStatus);
      }
      if (prioridade) {
        countQuery = countQuery.where('prioridade', '=', prioridade as SubmissionPriority);
      }
      if (operadorId) {
        countQuery = countQuery.where('operador_id', '=', operadorId as string);
      }
      if (analistaId) {
        countQuery = countQuery.where('analista_id', '=', analistaId as string);
      }
      if (search && typeof search === 'string') {
        countQuery = countQuery.where((eb) =>
          eb.or([
            eb('nome_motorista', 'ilike', `%${search}%`),
            eb('cpf', 'ilike', `%${search}%`),
            eb('placa', 'ilike', `%${search}%`),
          ])
        );
      }

      const [submissions, totalResult] = await Promise.all([
        query
          .orderBy('submissions.prioridade', 'desc')
          .orderBy('submissions.data_envio', 'desc') // Mudado para DESC (Mais recentes primeiro)
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
        'submissions.categoria_rejeicao',
        'submissions.tipo_cadastro',
        'submissions.devolvido_em',
        'submissions.devolvido_por',
        'submissions.updated_at',
        'submissions.created_at',
        'operador.id as operador_id',
        'operador.nome as operador_nome',
        'operador.email as operador_email',
        'analista.id as analista_id',
        'analista.nome as analista_nome',
        'analista.email as analista_email',
        // Novos campos
        'submissions.origem',
        'submissions.destino',
        'submissions.valor_mercadoria',
        'submissions.tipo_mercadoria',
        'submissions.tel_motorista',
        'submissions.tel_proprietario',
        'submissions.numero_pis',
        'submissions.endereco_residencial',
        'submissions.referencia_comercial_1',
        'submissions.referencia_comercial_2',
        'submissions.referencia_pessoal_1',
        'submissions.referencia_pessoal_2',
        'submissions.referencia_pessoal_3',
        'submissions.requer_rastreamento',
        'submissions.coordenadas_rastreamento',
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
    logger.info(`Recebido payload de criacao: ${JSON.stringify(data)}`);

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
        // Novos campos - migration 011
        tipo_cadastro: data.tipoCadastro,
        tel_proprietario: data.telProprietario,
        endereco_residencial: data.enderecoResidencial,
        numero_pis: data.numeroPis,
        valor_mercadoria: data.valorMercadoria,
        tel_motorista: data.telMotorista,
        referencia_comercial_1: data.referenciaComercial1,
        referencia_comercial_2: data.referenciaComercial2,
        referencia_pessoal_1: data.referenciaPessoal1,
        referencia_pessoal_2: data.referenciaPessoal2,
        referencia_pessoal_3: data.referenciaPessoal3,
        requer_rastreamento: data.requerRastreamento,
        coordenadas_rastreamento: data.coordenadasRastreamento ? JSON.stringify(data.coordenadasRastreamento) : null,
      })
      .returning([
        'id',
        'nome_motorista',
        'cpf',
        'status',
        'prioridade',
        'data_envio',
        'tipo_cadastro',
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

// Schema para atualizar submission
const updateSubmissionSchema = z.object({
  nomeMotorista: z.string().min(2).optional(),
  cpf: z.string().optional(), // Permitir corrigir CPF se necessario
  telefone: z.string().optional(),
  email: z.string().email().optional(),
  placa: z.string().optional(),
  tipoVeiculo: z.string().optional(),
  prioridade: z.enum(['normal', 'alta', 'urgente']).optional(),
  observacoes: z.string().optional(),

  // Novos campos para edição (migration 011)
  origem: z.string().optional(),
  destino: z.string().optional(),
  tipoMercadoria: z.string().optional(),
  valorMercadoria: z.number().optional(),
  telMotorista: z.string().optional(),
  telProprietario: z.string().optional(),
  numeroPis: z.string().optional(),
  enderecoResidencial: z.string().optional(),
  referenciaComercial1: z.string().optional(),
  referenciaComercial2: z.string().optional(),
  referenciaPessoal1: z.string().optional(),
  referenciaPessoal2: z.string().optional(),
  referenciaPessoal3: z.string().optional(),
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
    // Permitir editar se estiver pendente, em_analise (com cuidado) ou devolvido
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
        ...(data.cpf && { cpf: data.cpf }),
        ...(data.telefone !== undefined && { telefone: data.telefone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.placa !== undefined && { placa: data.placa }),
        ...(data.tipoVeiculo !== undefined && { tipo_veiculo: data.tipoVeiculo }),
        ...(data.prioridade && { prioridade: data.prioridade }),
        ...(data.observacoes !== undefined && { observacoes: data.observacoes }),

        // Novos campos
        ...(data.origem !== undefined && { origem: data.origem }),
        ...(data.destino !== undefined && { destino: data.destino }),
        ...(data.tipoMercadoria !== undefined && { tipo_mercadoria: data.tipoMercadoria }),
        ...(data.valorMercadoria !== undefined && { valor_mercadoria: data.valorMercadoria }),
        ...(data.telMotorista !== undefined && { tel_motorista: data.telMotorista }),
        ...(data.telProprietario !== undefined && { tel_proprietario: data.telProprietario }),
        ...(data.numeroPis !== undefined && { numero_pis: data.numeroPis }),
        ...(data.enderecoResidencial !== undefined && { endereco_residencial: data.enderecoResidencial }),
        ...(data.referenciaComercial1 !== undefined && { referencia_comercial_1: data.referenciaComercial1 }),
        ...(data.referenciaComercial2 !== undefined && { referencia_comercial_2: data.referenciaComercial2 }),
        ...(data.referenciaPessoal1 !== undefined && { referencia_pessoal_1: data.referenciaPessoal1 }),
        ...(data.referenciaPessoal2 !== undefined && { referencia_pessoal_2: data.referenciaPessoal2 }),
        ...(data.referenciaPessoal3 !== undefined && { referencia_pessoal_3: data.referenciaPessoal3 }),
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

/**
 * POST /api/fila/:id/devolver
 * Devolve uma submission para correção pelo operador
 */
router.post('/:id/devolver', requireAuth, requirePermission('aprovarCadastros'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { motivoDevolucao, categoria } = req.body;

    if (!motivoDevolucao) {
      return res.status(400).json({
        success: false,
        error: 'Motivo obrigatório',
        message: 'Informe o motivo da devolução',
      });
    }

    const existing = await db
      .selectFrom('submissions')
      .where('id', '=', id)
      .select(['id', 'status', 'operador_id'])
      .executeTakeFirst();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Submission não encontrada',
      });
    }

    if (existing.status !== 'em_analise' && existing.status !== 'pendente') {
      return res.status(400).json({
        success: false,
        error: 'Status inválido',
        message: 'Submission já foi finalizada',
      });
    }

    const updated = await db
      .updateTable('submissions')
      .set({
        status: 'devolvido',
        analista_id: authReq.user!.id,
        motivo_rejeicao: motivoDevolucao,
        devolvido_em: new Date(),
        devolvido_por: authReq.user!.id,
        ...(categoria && { categoria_rejeicao: categoria }),
      })
      .where('id', '=', id)
      .returning(['id', 'status', 'motivo_rejeicao', 'categoria_rejeicao', 'devolvido_em', 'devolvido_por'])
      .executeTakeFirst();

    logger.info(`Submission devolvida: ${id} por ${authReq.user?.email}`);

    // Emitir evento Socket.IO para notificar operador
    try {
      const io = getIO();
      const eventData = {
        id,
        motivoDevolucao,
        categoria,
        analista: authReq.user?.nome,
        devolvido_em: updated?.devolvido_em,
        submission: updated,
      };

      // Emitir para sala pessoal do operador
      io.to(`user:${existing.operador_id}`).emit('submission:devolvida', eventData);

      // Emitir para sala fila (para dashboards)
      io.to('fila').emit('submission:devolvida', eventData);

      // Emitir update para dashboard de gestao
      io.to('dashboard').emit('submission:updated', {
        id,
        status: 'devolvido',
        previousStatus: existing.status,
        analistaNome: authReq.user?.nome,
      });

      // Emitir notificacao visual para o operador
      io.to(`user:${existing.operador_id}`).emit('notification', {
        type: 'warning',
        title: 'Cadastro Devolvido',
        message: `Seu cadastro foi devolvido: ${motivoDevolucao}`,
        submissionId: id,
      });
    } catch (error) {
      logger.warn('Socket.IO não disponível para emitir evento de devolução:', error);
    }

    res.json({
      success: true,
      data: updated,
      message: 'Cadastro devolvido para correção',
    });
  } catch (error) {
    logger.error('Erro ao devolver submission:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao devolver cadastro',
    });
  }
});

/**
 * POST /api/fila/:id/reenviar
 * Reenvia uma submission devolvida após correções
 */
router.post('/:id/reenviar', requireAuth, requireAnyPermission('criarCadastros', 'viewDashboardOperador'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { observacoes } = req.body;

    const existing = await db
      .selectFrom('submissions')
      .where('id', '=', id)
      .select(['id', 'status', 'operador_id'])
      .executeTakeFirst();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Submission não encontrada',
      });
    }

    // Verificar se o operador é o dono do cadastro
    if (authReq.user?.role === 'operacional' && existing.operador_id !== authReq.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão',
        message: 'Você só pode reenviar seus próprios cadastros',
      });
    }

    if (existing.status !== 'devolvido') {
      return res.status(400).json({
        success: false,
        error: 'Status inválido',
        message: 'Apenas submissions devolvidas podem ser reenviadas',
      });
    }

    const updated = await db
      .updateTable('submissions')
      .set({
        status: 'pendente',
        motivo_rejeicao: null,
        categoria_rejeicao: null,
        analista_id: null,
        data_inicio_analise: null,
        data_conclusao: null,
        devolvido_em: null,
        devolvido_por: null,
        data_envio: new Date(),
        ...(observacoes && { observacoes }),
      })
      .where('id', '=', id)
      .returning(['id', 'status', 'data_envio'])
      .executeTakeFirst();

    logger.info(`Submission reenviada: ${id} por ${authReq.user?.email}`);

    // Emitir evento Socket.IO para notificar cadastrantes
    try {
      const io = getIO();
      const eventData = {
        id,
        status: 'pendente',
        previousStatus: 'devolvido',
        operadorNome: authReq.user?.nome,
        data_envio: updated?.data_envio,
      };

      // Emitir para sala fila (para cadastrantes)
      io.to('fila').emit('submission:reenviada', eventData);

      // Emitir para sala dashboard
      io.to('dashboard').emit('submission:reenviada', eventData);
      io.to('dashboard').emit('submission:updated', {
        id,
        status: 'pendente',
        previousStatus: 'devolvido',
        operadorNome: authReq.user?.nome,
      });

      // Notificacao visual para sala cadastro
      io.to('fila').emit('notification', {
        type: 'info',
        title: 'Cadastro Reenviado',
        message: `O operador ${authReq.user?.nome} reenviou um cadastro para análise`,
        submissionId: id,
      });
    } catch (error) {
      logger.warn('Socket.IO não disponível para emitir evento de reenvio:', error);
    }

    res.json({
      success: true,
      data: updated,
      message: 'Cadastro reenviado para análise',
    });
  } catch (error) {
    logger.error('Erro ao reenviar submission:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao reenviar cadastro',
    });
  }
});

export default router;

