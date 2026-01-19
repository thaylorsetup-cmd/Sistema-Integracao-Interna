/**
 * Service de Auditoria
 * Registra acoes no sistema
 */
import { db } from '../config/database.js';
import { logger } from '../config/logger.js';
import type { User } from '../types/database.js';

export interface AuditLogData {
  user?: User | null;
  acao: string;
  entidade: string;
  entidadeId?: string;
  dadosAnteriores?: unknown;
  dadosNovos?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registra uma acao no log de auditoria
 */
export async function registrarAuditoria(data: AuditLogData): Promise<void> {
  try {
    await db
      .insertInto('audit_logs')
      .values({
        user_id: data.user?.id,
        user_email: data.user?.email,
        user_nome: data.user?.nome,
        acao: data.acao,
        entidade: data.entidade,
        entidade_id: data.entidadeId,
        dados_anteriores: data.dadosAnteriores
          ? JSON.stringify(data.dadosAnteriores)
          : null,
        dados_novos: data.dadosNovos
          ? JSON.stringify(data.dadosNovos)
          : null,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
      })
      .execute();

    logger.debug(`Auditoria: ${data.acao} em ${data.entidade} por ${data.user?.email || 'sistema'}`);
  } catch (error) {
    // Nao deve falhar a operacao principal por causa de auditoria
    logger.error('Erro ao registrar auditoria:', error);
  }
}

/**
 * Busca logs de auditoria com filtros
 */
export async function buscarAuditoria(params: {
  userId?: string;
  entidade?: string;
  entidadeId?: string;
  acao?: string;
  dataInicio?: Date;
  dataFim?: Date;
  page?: number;
  limit?: number;
}) {
  const {
    userId,
    entidade,
    entidadeId,
    acao,
    dataInicio,
    dataFim,
    page = 1,
    limit = 50,
  } = params;

  let query = db
    .selectFrom('audit_logs')
    .select([
      'id',
      'user_id',
      'user_email',
      'user_nome',
      'acao',
      'entidade',
      'entidade_id',
      'dados_anteriores',
      'dados_novos',
      'ip_address',
      'created_at',
    ]);

  if (userId) {
    query = query.where('user_id', '=', userId);
  }

  if (entidade) {
    query = query.where('entidade', '=', entidade);
  }

  if (entidadeId) {
    query = query.where('entidade_id', '=', entidadeId);
  }

  if (acao) {
    query = query.where('acao', '=', acao);
  }

  if (dataInicio) {
    query = query.where('created_at', '>=', dataInicio);
  }

  if (dataFim) {
    query = query.where('created_at', '<=', dataFim);
  }

  const [logs, totalResult] = await Promise.all([
    query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit)
      .execute(),
    db
      .selectFrom('audit_logs')
      .select(db.fn.count('id').as('count'))
      .executeTakeFirst(),
  ]);

  return {
    logs,
    total: Number(totalResult?.count || 0),
    page,
    limit,
  };
}

/**
 * Helpers para acoes comuns
 */
export const AuditActions = {
  // Usuarios
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',

  // Submissions
  SUBMISSION_CREATE: 'submission.create',
  SUBMISSION_UPDATE: 'submission.update',
  SUBMISSION_ANALISE_START: 'submission.analise.start',
  SUBMISSION_APPROVE: 'submission.approve',
  SUBMISSION_REJECT: 'submission.reject',

  // Documentos
  DOCUMENT_UPLOAD: 'document.upload',
  DOCUMENT_VALIDATE: 'document.validate',
  DOCUMENT_DELETE: 'document.delete',
} as const;
