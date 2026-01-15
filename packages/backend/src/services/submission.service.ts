/**
 * Serviço de Submissões (Fila de Cadastros)
 */

import { db } from '../config/database.js';
import { logger } from '../config/logger.js';
import type { Submission, NewSubmission, SubmissionUpdate, SubmissionStatus, SubmissionPriority } from '../types/database.js';

export interface SubmissionFilters {
    status?: SubmissionStatus[];
    prioridade?: SubmissionPriority[];
    operadorId?: string;
    atribuidoA?: string;
    limit?: number;
    offset?: number;
}

export interface SubmissionWithOperator extends Submission {
    operador_nome: string;
    operador_email: string;
    atribuido_nome?: string | null;
    document_count: number;
}

/**
 * Cria nova submissão
 */
export async function createSubmission(data: NewSubmission): Promise<Submission> {
    const [submission] = await db
        .insertInto('submissions')
        .values({
            ...data,
            status: 'pendente',
            prioridade: data.prioridade || 'normal',
        })
        .returningAll()
        .execute();

    logger.info(`Submissão criada: ${submission.id}`);
    return submission;
}

/**
 * Busca submissão por ID
 */
export async function getSubmissionById(id: string): Promise<Submission | null> {
    const submission = await db
        .selectFrom('submissions')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();

    return submission || null;
}

/**
 * Busca submissão com dados do operador
 */
export async function getSubmissionWithDetails(id: string): Promise<SubmissionWithOperator | null> {
    const submission = await db
        .selectFrom('submissions as s')
        .innerJoin('users as operador', 'operador.id', 's.operador_id')
        .leftJoin('users as atribuido', 'atribuido.id', 's.atribuido_a')
        .select([
            's.id',
            's.operador_id',
            's.atribuido_a',
            's.status',
            's.prioridade',
            's.created_at',
            's.started_at',
            's.finished_at',
            's.motivo_rejeicao',
            'operador.name as operador_nome',
            'operador.email as operador_email',
            'atribuido.name as atribuido_nome',
        ])
        .where('s.id', '=', id)
        .executeTakeFirst();

    if (!submission) return null;

    // Contar documentos
    const docCount = await db
        .selectFrom('documents')
        .select(db.fn.count('id').as('count'))
        .where('submission_id', '=', id)
        .executeTakeFirst();

    return {
        ...submission,
        document_count: Number(docCount?.count || 0),
    } as SubmissionWithOperator;
}

/**
 * Lista submissões com filtros
 */
export async function getSubmissions(filters: SubmissionFilters = {}): Promise<{ submissions: SubmissionWithOperator[], total: number }> {
    let query = db
        .selectFrom('submissions as s')
        .innerJoin('users as operador', 'operador.id', 's.operador_id')
        .leftJoin('users as atribuido', 'atribuido.id', 's.atribuido_a')
        .select([
            's.id',
            's.operador_id',
            's.atribuido_a',
            's.status',
            's.prioridade',
            's.created_at',
            's.started_at',
            's.finished_at',
            's.motivo_rejeicao',
            'operador.name as operador_nome',
            'operador.email as operador_email',
            'atribuido.name as atribuido_nome',
        ]);

    let countQuery = db.selectFrom('submissions').select(db.fn.count('id').as('total'));

    // Filtros
    if (filters.status && filters.status.length > 0) {
        query = query.where('s.status', 'in', filters.status);
        countQuery = countQuery.where('status', 'in', filters.status);
    }

    if (filters.prioridade && filters.prioridade.length > 0) {
        query = query.where('s.prioridade', 'in', filters.prioridade);
        countQuery = countQuery.where('prioridade', 'in', filters.prioridade);
    }

    if (filters.operadorId) {
        query = query.where('s.operador_id', '=', filters.operadorId);
        countQuery = countQuery.where('operador_id', '=', filters.operadorId);
    }

    if (filters.atribuidoA) {
        query = query.where('s.atribuido_a', '=', filters.atribuidoA);
        countQuery = countQuery.where('atribuido_a', '=', filters.atribuidoA);
    }

    // Ordenar por prioridade (urgente primeiro) e depois por data
    query = query
        .orderBy(db.raw(`CASE prioridade WHEN 'urgente' THEN 1 WHEN 'alta' THEN 2 ELSE 3 END`))
        .orderBy('s.created_at', 'asc');

    // Paginação
    if (filters.limit) {
        query = query.limit(filters.limit);
    }
    if (filters.offset) {
        query = query.offset(filters.offset);
    }

    const [submissions, countResult] = await Promise.all([
        query.execute(),
        countQuery.executeTakeFirst(),
    ]);

    // Buscar contagem de documentos para cada submissão
    const submissionsWithDocs = await Promise.all(
        submissions.map(async (sub) => {
            const docCount = await db
                .selectFrom('documents')
                .select(db.fn.count('id').as('count'))
                .where('submission_id', '=', sub.id)
                .executeTakeFirst();

            return {
                ...sub,
                document_count: Number(docCount?.count || 0),
            } as SubmissionWithOperator;
        })
    );

    return {
        submissions: submissionsWithDocs,
        total: Number(countResult?.total || 0),
    };
}

/**
 * Atualiza status da submissão
 */
export async function updateSubmissionStatus(
    id: string,
    status: SubmissionStatus,
    atribuidoA?: string,
    motivoRejeicao?: string
): Promise<Submission | null> {
    const updateData: SubmissionUpdate = { status };

    if (status === 'em_analise') {
        updateData.started_at = new Date();
        if (atribuidoA) {
            updateData.atribuido_a = atribuidoA;
        }
    }

    if (status === 'aprovado' || status === 'rejeitado') {
        updateData.finished_at = new Date();
        if (status === 'rejeitado' && motivoRejeicao) {
            updateData.motivo_rejeicao = motivoRejeicao;
        }
    }

    const [submission] = await db
        .updateTable('submissions')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .execute();

    if (submission) {
        logger.info(`Submissão ${id} atualizada para status: ${status}`);
    }

    return submission || null;
}

/**
 * Calcula tempo de espera em minutos
 */
export function calcularTempoEspera(createdAt: Date, finishedAt: Date | null): number {
    const fim = finishedAt ? finishedAt.getTime() : Date.now();
    return Math.floor((fim - createdAt.getTime()) / (1000 * 60));
}

/**
 * Formata tempo de espera
 */
export function formatarTempoEspera(minutos: number): string {
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
}
