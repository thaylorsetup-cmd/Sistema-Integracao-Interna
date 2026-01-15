/**
 * Rotas de Documentos
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { asyncHandler, Errors } from '../middlewares/error.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { uploadMultiple } from '../middlewares/upload.middleware.js';
import * as documentService from '../services/document.service.js';
import * as auditService from '../services/audit.service.js';
import { config } from '../config/env.js';
import type { DocumentType } from '../types/database.js';

const router = Router();

const documentTypeSchema = z.enum([
    'crlv', 'antt', 'cnh', 'endereco', 'bancario',
    'pamcard', 'gr', 'rcv', 'doc_prop', 'end_prop', 'outros'
]);

/**
 * POST /api/documents/upload
 * Upload de múltiplos documentos
 */
router.post('/upload', authenticate, uploadMultiple, asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
        throw Errors.BadRequest('Nenhum arquivo enviado');
    }

    // Parsear metadados dos documentos
    const metadataRaw = req.body.metadata;
    let metadata: Array<{ type: DocumentType; customDescription?: string }> = [];

    if (metadataRaw) {
        try {
            metadata = JSON.parse(metadataRaw);
        } catch {
            throw Errors.BadRequest('Metadata inválido');
        }
    }

    // Criar registros de documentos
    const documents = await documentService.createDocuments(
        files.map((file, index) => ({
            submission_id: req.body.submission_id || null,
            type: metadata[index]?.type || 'outros',
            custom_description: metadata[index]?.customDescription || null,
            filename: file.originalname,
            filepath: file.path,
            mimetype: file.mimetype,
            size_bytes: file.size,
        }))
    );

    // Log
    await auditService.createLog({
        usuario_id: req.user!.id,
        usuario_nome: req.user!.name,
        tipo: 'CRIAR',
        modulo: 'Documentos',
        descricao: `${documents.length} documento(s) enviado(s)`,
        detalhes: { documentIds: documents.map(d => d.id) },
        ip: req.ip || null,
    });

    res.status(201).json({
        success: true,
        data: documents,
    });
}));

/**
 * GET /api/documents/:id
 * Busca metadados de um documento
 */
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const document = await documentService.getDocumentById(id);

    if (!document) {
        throw Errors.NotFound('Documento');
    }

    res.json({
        success: true,
        data: document,
    });
}));

/**
 * GET /api/documents/:id/download
 * Download do arquivo
 */
router.get('/:id/download', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const document = await documentService.getDocumentById(id);

    if (!document) {
        throw Errors.NotFound('Documento');
    }

    // Verificar se arquivo existe
    if (!fs.existsSync(document.filepath)) {
        throw Errors.NotFound('Arquivo não encontrado no servidor');
    }

    // Log de visualização
    await auditService.createLog({
        usuario_id: req.user!.id,
        usuario_nome: req.user!.name,
        tipo: 'VISUALIZAR',
        modulo: 'Documentos',
        descricao: `Download: ${document.filename}`,
        detalhes: { documentId: document.id },
        ip: req.ip || null,
    });

    res.download(document.filepath, document.filename);
}));

/**
 * DELETE /api/documents/:id
 * Remove documento
 */
router.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Somente admin e gestor podem deletar
    if (!['admin', 'gestor'].includes(req.user!.role)) {
        throw Errors.Forbidden('Sem permissão para deletar documentos');
    }

    const document = await documentService.getDocumentById(id);

    if (!document) {
        throw Errors.NotFound('Documento');
    }

    await documentService.deleteDocument(id);

    // Log
    await auditService.createLog({
        usuario_id: req.user!.id,
        usuario_nome: req.user!.name,
        tipo: 'DELETAR',
        modulo: 'Documentos',
        descricao: `Documento removido: ${document.filename}`,
        detalhes: { documentId: id, type: document.type },
        ip: req.ip || null,
    });

    res.json({
        success: true,
        message: 'Documento removido',
    });
}));

export default router;
