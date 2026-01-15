/**
 * Serviço de Documentos
 */

import { db } from '../config/database.js';
import { logger } from '../config/logger.js';
import fs from 'fs/promises';
import path from 'path';
import type { Document, NewDocument, DocumentType } from '../types/database.js';

/**
 * Cria registro de documento no banco
 */
export async function createDocument(data: NewDocument): Promise<Document> {
    const [doc] = await db
        .insertInto('documents')
        .values(data)
        .returningAll()
        .execute();

    logger.debug(`Documento criado: ${doc.id} - ${doc.type}`);
    return doc;
}

/**
 * Cria múltiplos documentos de uma vez
 */
export async function createDocuments(documents: NewDocument[]): Promise<Document[]> {
    if (documents.length === 0) return [];

    const docs = await db
        .insertInto('documents')
        .values(documents)
        .returningAll()
        .execute();

    logger.debug(`${docs.length} documentos criados`);
    return docs;
}

/**
 * Busca documento por ID
 */
export async function getDocumentById(id: string): Promise<Document | null> {
    const doc = await db
        .selectFrom('documents')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();

    return doc || null;
}

/**
 * Busca documentos de uma submissão
 */
export async function getDocumentsBySubmission(submissionId: string): Promise<Document[]> {
    return db
        .selectFrom('documents')
        .selectAll()
        .where('submission_id', '=', submissionId)
        .orderBy('type', 'asc')
        .execute();
}

/**
 * Remove documento (arquivo e registro)
 */
export async function deleteDocument(id: string): Promise<boolean> {
    const doc = await getDocumentById(id);

    if (!doc) return false;

    // Remover arquivo físico
    try {
        await fs.unlink(doc.filepath);
    } catch (err) {
        logger.warn(`Falha ao remover arquivo: ${doc.filepath}`);
    }

    // Remover do banco
    await db
        .deleteFrom('documents')
        .where('id', '=', id)
        .execute();

    logger.debug(`Documento removido: ${id}`);
    return true;
}

/**
 * Remove todos os documentos de uma submissão
 */
export async function deleteDocumentsBySubmission(submissionId: string): Promise<number> {
    const docs = await getDocumentsBySubmission(submissionId);

    // Remover arquivos físicos
    for (const doc of docs) {
        try {
            await fs.unlink(doc.filepath);
        } catch (err) {
            logger.warn(`Falha ao remover arquivo: ${doc.filepath}`);
        }
    }

    // Remover do banco
    const result = await db
        .deleteFrom('documents')
        .where('submission_id', '=', submissionId)
        .execute();

    logger.debug(`${docs.length} documentos removidos da submissão ${submissionId}`);
    return docs.length;
}

/**
 * Agrupa documentos por tipo
 */
export function groupDocumentsByType(documents: Document[]): Record<string, Document[]> {
    return documents.reduce((acc, doc) => {
        if (!acc[doc.type]) {
            acc[doc.type] = [];
        }
        acc[doc.type].push(doc);
        return acc;
    }, {} as Record<string, Document[]>);
}
