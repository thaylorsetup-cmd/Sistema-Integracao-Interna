/**
 * Serviço de Auditoria
 */

import { db } from '../config/database.js';
import { logger } from '../config/logger.js';
import type { AuditLog, NewAuditLog, LogType } from '../types/database.js';

export interface LogFilters {
    tipo?: LogType[];
    usuarioId?: string;
    modulo?: string;
    dataInicio?: Date;
    dataFim?: Date;
    limit?: number;
    offset?: number;
}

/**
 * Cria um novo log de auditoria
 */
export async function createLog(data: Omit<NewAuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const [log] = await db
        .insertInto('audit_logs')
        .values({
            ...data,
            detalhes: data.detalhes || null,
        })
        .returningAll()
        .execute();

    logger.debug(`Log criado: ${data.tipo} - ${data.descricao}`);
    return log;
}

/**
 * Busca logs com filtros
 */
export async function getLogs(filters: LogFilters = {}): Promise<{ logs: AuditLog[], total: number }> {
    let query = db.selectFrom('audit_logs').selectAll();
    let countQuery = db.selectFrom('audit_logs').select(db.fn.count('id').as('total'));

    // Aplicar filtros
    if (filters.tipo && filters.tipo.length > 0) {
        query = query.where('tipo', 'in', filters.tipo);
        countQuery = countQuery.where('tipo', 'in', filters.tipo);
    }

    if (filters.usuarioId) {
        query = query.where('usuario_id', '=', filters.usuarioId);
        countQuery = countQuery.where('usuario_id', '=', filters.usuarioId);
    }

    if (filters.modulo) {
        query = query.where('modulo', 'ilike', `%${filters.modulo}%`);
        countQuery = countQuery.where('modulo', 'ilike', `%${filters.modulo}%`);
    }

    if (filters.dataInicio) {
        query = query.where('timestamp', '>=', filters.dataInicio);
        countQuery = countQuery.where('timestamp', '>=', filters.dataInicio);
    }

    if (filters.dataFim) {
        query = query.where('timestamp', '<=', filters.dataFim);
        countQuery = countQuery.where('timestamp', '<=', filters.dataFim);
    }

    // Ordenar por mais recente
    query = query.orderBy('timestamp', 'desc');

    // Paginação
    if (filters.limit) {
        query = query.limit(filters.limit);
    }

    if (filters.offset) {
        query = query.offset(filters.offset);
    }

    const [logs, countResult] = await Promise.all([
        query.execute(),
        countQuery.executeTakeFirst(),
    ]);

    return {
        logs,
        total: Number(countResult?.total || 0),
    };
}

/**
 * Busca logs de um usuário específico
 */
export async function getLogsByUser(usuarioId: string, limit: number = 50): Promise<AuditLog[]> {
    return db
        .selectFrom('audit_logs')
        .selectAll()
        .where('usuario_id', '=', usuarioId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .execute();
}

/**
 * Exporta logs para JSON
 */
export async function exportLogsJson(filters: LogFilters = {}): Promise<AuditLog[]> {
    const { logs } = await getLogs({ ...filters, limit: 10000 });
    return logs;
}

/**
 * Exporta logs para CSV
 */
export async function exportLogsCsv(filters: LogFilters = {}): Promise<string> {
    const { logs } = await getLogs({ ...filters, limit: 10000 });

    const headers = ['ID', 'Data/Hora', 'Usuário', 'Tipo', 'Módulo', 'Descrição', 'IP'];
    const rows = logs.map(log => [
        log.id,
        new Date(log.timestamp).toISOString(),
        log.usuario_nome,
        log.tipo,
        log.modulo,
        log.descricao,
        log.ip || '',
    ]);

    return [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
}
