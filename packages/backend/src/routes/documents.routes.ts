/**
 * Rotas de Documentos
 * Upload, download e gerenciamento de documentos
 */
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../config/database.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  getFilePath,
  fileExists,
} from '../middlewares/upload.middleware.js';
import { uploadRateLimiter, downloadRateLimiter } from '../middlewares/rate-limit.middleware.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import type { AuthenticatedRequest } from '../types/api.js';
import type { DocumentType } from '../types/database.js';

const router = Router();

// Tipos de documento validos
const VALID_DOCUMENT_TYPES: DocumentType[] = [
  'crlv',
  'antt',
  'cnh',
  'endereco',
  'bancario',
  'pamcard',
  'gr',
  'rcv',
  'contrato',
  'outros',
];

/**
 * GET /api/documents
 * Lista documentos (com filtros)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { submissionId, tipo, validado, page = '1', limit = '20' } = req.query;

    let query = db
      .selectFrom('documents')
      .leftJoin('users as uploader', 'documents.uploaded_by', 'uploader.id')
      .leftJoin('users as validador', 'documents.validado_por', 'validador.id')
      .select([
        'documents.id',
        'documents.submission_id',
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
      ]);

    // Filtros
    if (submissionId) {
      query = query.where('documents.submission_id', '=', submissionId as string);
    }

    if (tipo) {
      query = query.where('documents.tipo', '=', tipo as DocumentType);
    }

    if (validado !== undefined) {
      query = query.where('documents.validado', '=', validado === 'true');
    }

    const [documents, totalResult] = await Promise.all([
      query
        .orderBy('documents.uploaded_at', 'desc')
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit))
        .execute(),
      db
        .selectFrom('documents')
        .select(db.fn.count('id').as('count'))
        .executeTakeFirst(),
    ]);

    const total = Number(totalResult?.count || 0);

    res.json({
      success: true,
      data: documents,
      pagination: {
        total,
        page: Number(page),
        pageSize: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Erro ao listar documentos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar documentos',
    });
  }
});

/**
 * GET /api/documents/:id
 * Metadados de um documento
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const document = await db
      .selectFrom('documents')
      .leftJoin('users as uploader', 'documents.uploaded_by', 'uploader.id')
      .leftJoin('users as validador', 'documents.validado_por', 'validador.id')
      .leftJoin('submissions', 'documents.submission_id', 'submissions.id')
      .where('documents.id', '=', id)
      .select([
        'documents.id',
        'documents.submission_id',
        'documents.tipo',
        'documents.nome_original',
        'documents.nome_armazenado',
        'documents.mime_type',
        'documents.tamanho_bytes',
        'documents.validado',
        'documents.validado_em',
        'documents.observacao_validacao',
        'documents.uploaded_at',
        'documents.created_at',
        'uploader.id as uploaded_by_id',
        'uploader.nome as uploaded_by_nome',
        'validador.id as validado_por_id',
        'validador.nome as validado_por_nome',
        'submissions.nome_motorista',
        'submissions.cpf',
      ])
      .executeTakeFirst();

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Documento nao encontrado',
      });
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    logger.error('Erro ao buscar documento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar documento',
    });
  }
});

/**
 * GET /api/documents/:id/download
 * Download do arquivo
 */
router.get('/:id/download', requireAuth, downloadRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    const document = await db
      .selectFrom('documents')
      .where('id', '=', id)
      .select(['caminho', 'nome_original', 'mime_type'])
      .executeTakeFirst();

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Documento nao encontrado',
      });
    }

    const filePath = getFilePath(document.caminho);

    if (!fileExists(document.caminho)) {
      logger.error(`Arquivo nao encontrado: ${filePath}`);
      return res.status(404).json({
        success: false,
        error: 'Arquivo nao encontrado no servidor',
      });
    }

    res.setHeader('Content-Type', document.mime_type);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(document.nome_original)}"`
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Erro ao fazer download:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer download',
    });
  }
});

/**
 * GET /api/documents/:id/preview
 * Preview do arquivo (inline)
 */
router.get('/:id/preview', requireAuth, downloadRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    const document = await db
      .selectFrom('documents')
      .where('id', '=', id)
      .select(['caminho', 'nome_original', 'mime_type', 'tamanho_bytes'])
      .executeTakeFirst();

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Documento nao encontrado',
      });
    }

    const filePath = getFilePath(document.caminho);

    if (!fileExists(document.caminho)) {
      logger.error(`Arquivo nao encontrado: ${filePath}`);
      return res.status(404).json({
        success: false,
        error: 'Arquivo nao encontrado no servidor',
      });
    }

    // Headers para visualização inline
    res.setHeader('Content-Type', document.mime_type);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(document.nome_original)}"`
    );
    res.setHeader('Content-Length', document.tamanho_bytes.toString());

    // Suporte a range requests (HTTP 206) para PDFs grandes
    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;

      if (start >= stat.size || end >= stat.size) {
        res.status(416).setHeader('Content-Range', `bytes */${stat.size}`);
        return res.end();
      }

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      res.setHeader('Content-Length', (end - start + 1).toString());
      res.setHeader('Accept-Ranges', 'bytes');

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      // Streaming completo
      res.setHeader('Accept-Ranges', 'bytes');
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  } catch (error) {
    logger.error('Erro ao fazer preview:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer preview',
    });
  }
});

/**
 * POST /api/documents/upload
 * Upload de documento unico
 */
router.post(
  '/upload',
  requireAuth,
  requirePermission('criarCadastros'),
  uploadRateLimiter,
  uploadSingle,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { submissionId, tipo } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'Arquivo obrigatorio',
        });
      }

      if (!submissionId) {
        // Deletar arquivo se nao tiver submissionId
        await deleteFile(file.path);
        return res.status(400).json({
          success: false,
          error: 'submissionId obrigatorio',
        });
      }

      if (!tipo || !VALID_DOCUMENT_TYPES.includes(tipo)) {
        await deleteFile(file.path);
        return res.status(400).json({
          success: false,
          error: 'Tipo de documento invalido',
          validTypes: VALID_DOCUMENT_TYPES,
        });
      }

      // Verificar se submission existe
      const submission = await db
        .selectFrom('submissions')
        .where('id', '=', submissionId)
        .select(['id', 'status'])
        .executeTakeFirst();

      if (!submission) {
        await deleteFile(file.path);
        return res.status(404).json({
          success: false,
          error: 'Submission nao encontrada',
        });
      }

      // Calcular caminho relativo
      const relativePath = path.relative(path.resolve(env.UPLOAD_DIR), file.path);

      // Criar registro do documento
      const document = await db
        .insertInto('documents')
        .values({
          submission_id: submissionId,
          tipo: tipo as DocumentType,
          nome_original: file.originalname,
          nome_armazenado: file.filename,
          mime_type: file.mimetype,
          tamanho_bytes: file.size,
          caminho: relativePath,
          uploaded_by: authReq.user!.id,
          validado: false,
        })
        .returning([
          'id',
          'tipo',
          'nome_original',
          'mime_type',
          'tamanho_bytes',
          'uploaded_at',
        ])
        .executeTakeFirst();

      logger.info(
        `Documento uploaded: ${document?.id} (${tipo}) por ${authReq.user?.email}`
      );

      res.status(201).json({
        success: true,
        data: document,
        message: 'Documento enviado com sucesso',
      });
    } catch (error) {
      // Tentar deletar arquivo em caso de erro
      if (req.file) {
        await deleteFile(req.file.path);
      }

      logger.error('Erro no upload:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao fazer upload',
      });
    }
  }
);

/**
 * POST /api/documents/upload-multiple
 * Upload de multiplos documentos
 */
router.post(
  '/upload-multiple',
  requireAuth,
  requirePermission('criarCadastros'),
  uploadRateLimiter,
  uploadMultiple,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { submissionId, tipos } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Arquivos obrigatorios',
        });
      }

      if (!submissionId) {
        // Deletar arquivos
        for (const file of files) {
          await deleteFile(file.path);
        }
        return res.status(400).json({
          success: false,
          error: 'submissionId obrigatorio',
        });
      }

      // Parse tipos se for string JSON
      let tiposArray: string[];
      try {
        tiposArray = typeof tipos === 'string' ? JSON.parse(tipos) : tipos;
      } catch {
        tiposArray = [];
      }

      if (!tiposArray || tiposArray.length !== files.length) {
        for (const file of files) {
          await deleteFile(file.path);
        }
        return res.status(400).json({
          success: false,
          error: 'Quantidade de tipos deve corresponder a quantidade de arquivos',
        });
      }

      // Verificar submission
      const submission = await db
        .selectFrom('submissions')
        .where('id', '=', submissionId)
        .select(['id'])
        .executeTakeFirst();

      if (!submission) {
        for (const file of files) {
          await deleteFile(file.path);
        }
        return res.status(404).json({
          success: false,
          error: 'Submission nao encontrada',
        });
      }

      // Criar documentos
      const documents = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const tipo = tiposArray[i] as DocumentType;

        if (!VALID_DOCUMENT_TYPES.includes(tipo)) {
          continue; // Pula tipos invalidos
        }

        const relativePath = path.relative(path.resolve(env.UPLOAD_DIR), file.path);

        const doc = await db
          .insertInto('documents')
          .values({
            submission_id: submissionId,
            tipo,
            nome_original: file.originalname,
            nome_armazenado: file.filename,
            mime_type: file.mimetype,
            tamanho_bytes: file.size,
            caminho: relativePath,
            uploaded_by: authReq.user!.id,
            validado: false,
          })
          .returning(['id', 'tipo', 'nome_original', 'tamanho_bytes'])
          .executeTakeFirst();

        if (doc) {
          documents.push(doc);
        }
      }

      logger.info(
        `${documents.length} documentos uploaded para submission ${submissionId} por ${authReq.user?.email}`
      );

      res.status(201).json({
        success: true,
        data: documents,
        message: `${documents.length} documento(s) enviado(s) com sucesso`,
      });
    } catch (error) {
      // Tentar deletar arquivos em caso de erro
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          await deleteFile(file.path);
        }
      }

      logger.error('Erro no upload multiplo:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao fazer upload',
      });
    }
  }
);

/**
 * PUT /api/documents/:id/validar
 * Valida ou invalida um documento
 */
router.put(
  '/:id/validar',
  requireAuth,
  requirePermission('aprovarCadastros'),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const { validado, observacao } = req.body;

      if (typeof validado !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Campo validado obrigatorio (boolean)',
        });
      }

      const updated = await db
        .updateTable('documents')
        .set({
          validado,
          validado_por: authReq.user!.id,
          validado_em: new Date(),
          observacao_validacao: observacao || null,
        })
        .where('id', '=', id)
        .returning(['id', 'tipo', 'validado', 'validado_em', 'observacao_validacao'])
        .executeTakeFirst();

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Documento nao encontrado',
        });
      }

      logger.info(
        `Documento ${id} ${validado ? 'validado' : 'invalidado'} por ${authReq.user?.email}`
      );

      res.json({
        success: true,
        data: updated,
        message: validado ? 'Documento validado' : 'Documento invalidado',
      });
    } catch (error) {
      logger.error('Erro ao validar documento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao validar documento',
      });
    }
  }
);

/**
 * DELETE /api/documents/:id
 * Remove documento
 */
router.delete(
  '/:id',
  requireAuth,
  requirePermission('deletarCadastros'),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      // Buscar documento
      const document = await db
        .selectFrom('documents')
        .where('id', '=', id)
        .select(['id', 'caminho', 'nome_original'])
        .executeTakeFirst();

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Documento nao encontrado',
        });
      }

      // Deletar arquivo fisico
      await deleteFile(document.caminho);

      // Deletar registro
      await db.deleteFrom('documents').where('id', '=', id).execute();

      logger.info(`Documento deletado: ${id} por ${authReq.user?.email}`);

      res.json({
        success: true,
        message: 'Documento removido com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao deletar documento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao deletar documento',
      });
    }
  }
);

export default router;
