/**
 * Service de Submissions
 * Logica de negocio da fila de cadastros
 */
import { sql } from 'kysely';
import { db } from '../config/database.js';
import { logger } from '../config/logger.js';
import { registrarAuditoria, AuditActions } from './audit.service.js';
import type { User, SubmissionStatus, SubmissionPriority } from '../types/database.js';

export interface CreateSubmissionData {
  nomeMotorista?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  placa?: string;
  tipoVeiculo?: string;
  prioridade?: SubmissionPriority;
  observacoes?: string;
  origem?: string;
  destino?: string;
  localizacaoAtual?: string;
  tipoMercadoria?: string;
}

export interface UpdateSubmissionData {
  nomeMotorista?: string;
  telefone?: string;
  email?: string;
  placa?: string;
  tipoVeiculo?: string;
  prioridade?: SubmissionPriority;
  observacoes?: string;
}

/**
 * Cria nova submission
 */
export async function criarSubmission(
  data: CreateSubmissionData,
  operador: User,
  ipAddress?: string
) {
  const submission = await db
    .insertInto('submissions')
    .values({
      nome_motorista: data.nomeMotorista,
      cpf: data.cpf,
      telefone: data.telefone,
      email: data.email,
      placa: data.placa,
      tipo_veiculo: data.tipoVeiculo,
      prioridade: data.prioridade || 'normal',
      observacoes: data.observacoes,
      operador_id: operador.id,
      status: 'pendente',
      data_envio: new Date(),
    })
    .returningAll()
    .executeTakeFirst();

  if (submission) {
    await registrarAuditoria({
      user: operador,
      acao: AuditActions.SUBMISSION_CREATE,
      entidade: 'submission',
      entidadeId: submission.id,
      dadosNovos: submission,
      ipAddress,
    });

    logger.info(`Submission criada: ${submission.id} por ${operador.email}`);
  }

  return submission;
}

/**
 * Atualiza submission
 */
export async function atualizarSubmission(
  id: string,
  data: UpdateSubmissionData,
  user: User,
  ipAddress?: string
) {
  // Buscar dados anteriores
  const anterior = await db
    .selectFrom('submissions')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirst();

  if (!anterior) {
    return null;
  }

  // Verificar se pode ser editada
  if (anterior.status === 'aprovado' || anterior.status === 'rejeitado') {
    throw new Error('Submission ja finalizada nao pode ser editada');
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
    .returningAll()
    .executeTakeFirst();

  if (updated) {
    await registrarAuditoria({
      user,
      acao: AuditActions.SUBMISSION_UPDATE,
      entidade: 'submission',
      entidadeId: id,
      dadosAnteriores: anterior,
      dadosNovos: updated,
      ipAddress,
    });
  }

  return updated;
}

/**
 * Inicia analise de submission
 */
export async function iniciarAnalise(
  id: string,
  analista: User,
  ipAddress?: string
) {
  const anterior = await db
    .selectFrom('submissions')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirst();

  if (!anterior) {
    return null;
  }

  if (anterior.status !== 'pendente') {
    throw new Error('Apenas submissions pendentes podem ser analisadas');
  }

  const updated = await db
    .updateTable('submissions')
    .set({
      status: 'em_analise',
      analista_id: analista.id,
      data_inicio_analise: new Date(),
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst();

  if (updated) {
    await registrarAuditoria({
      user: analista,
      acao: AuditActions.SUBMISSION_ANALISE_START,
      entidade: 'submission',
      entidadeId: id,
      dadosAnteriores: { status: anterior.status },
      dadosNovos: { status: 'em_analise', analista_id: analista.id },
      ipAddress,
    });

    logger.info(`Analise iniciada: ${id} por ${analista.email}`);
  }

  return updated;
}

/**
 * Aprova submission
 */
export async function aprovarSubmission(
  id: string,
  analista: User,
  observacoes?: string,
  ipAddress?: string
) {
  const anterior = await db
    .selectFrom('submissions')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirst();

  if (!anterior) {
    return null;
  }

  if (anterior.status === 'aprovado' || anterior.status === 'rejeitado') {
    throw new Error('Submission ja foi finalizada');
  }

  const updated = await db
    .updateTable('submissions')
    .set({
      status: 'aprovado',
      analista_id: analista.id,
      data_conclusao: new Date(),
      ...(observacoes && { observacoes }),
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst();

  if (updated) {
    await registrarAuditoria({
      user: analista,
      acao: AuditActions.SUBMISSION_APPROVE,
      entidade: 'submission',
      entidadeId: id,
      dadosAnteriores: { status: anterior.status },
      dadosNovos: { status: 'aprovado' },
      ipAddress,
    });

    logger.info(`Submission aprovada: ${id} por ${analista.email}`);
  }

  return updated;
}

/**
 * Rejeita submission
 */
export async function rejeitarSubmission(
  id: string,
  analista: User,
  motivoRejeicao: string,
  categoriaRejeicao?: string,
  ipAddress?: string
) {
  const anterior = await db
    .selectFrom('submissions')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirst();

  if (!anterior) {
    return null;
  }

  if (anterior.status === 'aprovado' || anterior.status === 'rejeitado') {
    throw new Error('Submission ja foi finalizada');
  }

  const updated = await db
    .updateTable('submissions')
    .set({
      status: 'rejeitado',
      analista_id: analista.id,
      data_conclusao: new Date(),
      motivo_rejeicao: motivoRejeicao,
      ...(categoriaRejeicao && { categoria_rejeicao: categoriaRejeicao }),
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst();

  if (updated) {
    await registrarAuditoria({
      user: analista,
      acao: AuditActions.SUBMISSION_REJECT,
      entidade: 'submission',
      entidadeId: id,
      dadosAnteriores: { status: anterior.status },
      dadosNovos: { status: 'rejeitado', motivo_rejeicao: motivoRejeicao, categoria_rejeicao: categoriaRejeicao },
      ipAddress,
    });

    logger.info(`Submission rejeitada: ${id} por ${analista.email} - Categoria: ${categoriaRejeicao}`);
  }

  return updated;
}

/**
 * Adiciona motivo de atraso
 */
export async function adicionarAtraso(
  submissionId: string,
  motivo: string,
  user: User,
  ipAddress?: string
) {
  // Verificar se submission existe
  const submission = await db
    .selectFrom('submissions')
    .where('id', '=', submissionId)
    .selectAll()
    .executeTakeFirst();

  if (!submission) {
    throw new Error('Submission nao encontrada');
  }

  // Criar registro de atraso
  const delay = await db
    .insertInto('delays')
    .values({
      submission_id: submissionId,
      motivo,
      criado_por: user.id,
      criado_em: new Date(),
      notificado: false,
    })
    .returningAll()
    .executeTakeFirst();

  if (delay) {
    await registrarAuditoria({
      user,
      acao: 'ATRASO' as any,
      entidade: 'submission',
      entidadeId: submissionId,
      dadosNovos: { motivo, delay_id: delay.id },
      ipAddress,
    });

    logger.info(`Atraso adicionado: ${delay.id} para submission ${submissionId} por ${user.email}`);
  }

  return delay;
}

/**
 * Busca atrasos de uma submission
 */
export async function buscarDelays(submissionId: string) {
  const delays = await db
    .selectFrom('delays')
    .leftJoin('users', 'delays.criado_por', 'users.id')
    .where('submission_id', '=', submissionId)
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

  return delays;
}

/**
 * Marca atraso como notificado
 */
export async function marcarAtrasoNotificado(delayId: string) {
  const updated = await db
    .updateTable('delays')
    .set({
      notificado: true,
      notificado_em: new Date(),
    })
    .where('id', '=', delayId)
    .returningAll()
    .executeTakeFirst();

  return updated;
}

/**
 * Busca estatisticas da fila
 */
export async function getFilaStats() {
  const [statusCounts, tempoMedio] = await Promise.all([
    db
      .selectFrom('submissions')
      .select([
        'status',
        db.fn.count('id').as('count'),
      ])
      .groupBy('status')
      .execute(),
    db
      .selectFrom('submissions')
      .select(
        sql<number>`AVG(EXTRACT(EPOCH FROM (data_conclusao - data_inicio_analise)) / 60)`.as('tempo_medio_minutos')
      )
      .where('data_conclusao', 'is not', null)
      .where('data_inicio_analise', 'is not', null)
      .executeTakeFirst(),
  ]);

  const stats = {
    pendentes: 0,
    emAnalise: 0,
    aprovados: 0,
    rejeitados: 0,
    total: 0,
    tempoMedioMinutos: Math.round(Number(tempoMedio?.tempo_medio_minutos) || 0),
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

  return stats;
}
