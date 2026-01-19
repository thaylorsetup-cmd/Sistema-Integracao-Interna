/**
 * Service de Documentos
 * Logica de negocio para documentos
 */
import path from 'path';
import { db } from '../config/database.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { deleteFile } from '../middlewares/upload.middleware.js';
import { registrarAuditoria, AuditActions } from './audit.service.js';
import type { User, DocumentType } from '../types/database.js';

export interface CreateDocumentData {
  submissionId: string;
  tipo: DocumentType;
  nomeOriginal: string;
  nomeArmazenado: string;
  mimeType: string;
  tamanhoBytes: number;
  caminho: string;
}

/**
 * Cria registro de documento
 */
export async function criarDocumento(
  data: CreateDocumentData,
  uploadedBy: User,
  ipAddress?: string
) {
  const document = await db
    .insertInto('documents')
    .values({
      submission_id: data.submissionId,
      tipo: data.tipo,
      nome_original: data.nomeOriginal,
      nome_armazenado: data.nomeArmazenado,
      mime_type: data.mimeType,
      tamanho_bytes: data.tamanhoBytes,
      caminho: data.caminho,
      uploaded_by: uploadedBy.id,
      validado: false,
    })
    .returningAll()
    .executeTakeFirst();

  if (document) {
    await registrarAuditoria({
      user: uploadedBy,
      acao: AuditActions.DOCUMENT_UPLOAD,
      entidade: 'document',
      entidadeId: document.id,
      dadosNovos: {
        tipo: data.tipo,
        nomeOriginal: data.nomeOriginal,
        submissionId: data.submissionId,
      },
      ipAddress,
    });

    logger.info(`Documento criado: ${document.id} (${data.tipo}) por ${uploadedBy.email}`);
  }

  return document;
}

/**
 * Valida ou invalida documento
 */
export async function validarDocumento(
  id: string,
  validado: boolean,
  validador: User,
  observacao?: string,
  ipAddress?: string
) {
  const anterior = await db
    .selectFrom('documents')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirst();

  if (!anterior) {
    return null;
  }

  const updated = await db
    .updateTable('documents')
    .set({
      validado,
      validado_por: validador.id,
      validado_em: new Date(),
      observacao_validacao: observacao || null,
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst();

  if (updated) {
    await registrarAuditoria({
      user: validador,
      acao: AuditActions.DOCUMENT_VALIDATE,
      entidade: 'document',
      entidadeId: id,
      dadosAnteriores: { validado: anterior.validado },
      dadosNovos: { validado, observacao },
      ipAddress,
    });

    logger.info(
      `Documento ${id} ${validado ? 'validado' : 'invalidado'} por ${validador.email}`
    );
  }

  return updated;
}

/**
 * Remove documento (fisico e registro)
 */
export async function removerDocumento(
  id: string,
  user: User,
  ipAddress?: string
) {
  const document = await db
    .selectFrom('documents')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirst();

  if (!document) {
    return false;
  }

  // Deletar arquivo fisico
  const filePath = path.join(env.UPLOAD_DIR, document.caminho);
  await deleteFile(filePath);

  // Deletar registro
  await db.deleteFrom('documents').where('id', '=', id).execute();

  await registrarAuditoria({
    user,
    acao: AuditActions.DOCUMENT_DELETE,
    entidade: 'document',
    entidadeId: id,
    dadosAnteriores: {
      tipo: document.tipo,
      nomeOriginal: document.nome_original,
      submissionId: document.submission_id,
    },
    ipAddress,
  });

  logger.info(`Documento removido: ${id} por ${user.email}`);

  return true;
}

/**
 * Busca documentos de uma submission
 */
export async function getDocumentosBySubmission(submissionId: string) {
  return db
    .selectFrom('documents')
    .leftJoin('users as uploader', 'documents.uploaded_by', 'uploader.id')
    .leftJoin('users as validador', 'documents.validado_por', 'validador.id')
    .where('documents.submission_id', '=', submissionId)
    .select([
      'documents.id',
      'documents.tipo',
      'documents.nome_original',
      'documents.mime_type',
      'documents.tamanho_bytes',
      'documents.validado',
      'documents.validado_em',
      'documents.observacao_validacao',
      'documents.uploaded_at',
      'uploader.nome as uploaded_by_nome',
      'validador.nome as validado_por_nome',
    ])
    .orderBy('documents.tipo', 'asc')
    .execute();
}

/**
 * Verifica se todos documentos obrigatorios foram enviados
 */
export async function verificarDocumentosObrigatorios(submissionId: string) {
  const TIPOS_OBRIGATORIOS: DocumentType[] = [
    'crlv',
    'antt',
    'cnh',
    'endereco',
    'bancario',
    'pamcard',
    'gr',
    'rcv',
  ];

  const documentos = await db
    .selectFrom('documents')
    .where('submission_id', '=', submissionId)
    .select(['tipo'])
    .execute();

  const tiposEnviados = new Set(documentos.map((d) => d.tipo));

  const faltantes = TIPOS_OBRIGATORIOS.filter((t) => !tiposEnviados.has(t));
  const completo = faltantes.length === 0;

  return {
    completo,
    faltantes,
    enviados: Array.from(tiposEnviados),
    totalObrigatorios: TIPOS_OBRIGATORIOS.length,
    totalEnviados: tiposEnviados.size,
  };
}

/**
 * Verifica se todos documentos foram validados
 */
export async function verificarDocumentosValidados(submissionId: string) {
  const documentos = await db
    .selectFrom('documents')
    .where('submission_id', '=', submissionId)
    .select(['id', 'tipo', 'validado'])
    .execute();

  const naoValidados = documentos.filter((d) => !d.validado);
  const todosValidados = naoValidados.length === 0;

  return {
    todosValidados,
    total: documentos.length,
    validados: documentos.length - naoValidados.length,
    naoValidados: naoValidados.map((d) => ({ id: d.id, tipo: d.tipo })),
  };
}
