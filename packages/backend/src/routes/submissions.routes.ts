/**
 * Rotas de Submissões (Fila de Cadastros GR)
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, Errors } from '../middlewares/error.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import * as submissionService from '../services/submission.service.js';
import * as documentService from '../services/document.service.js';
import * as auditService from '../services/audit.service.js';
import { io } from '../index.js';

const router = Router();

// Schemas
const createSubmissionSchema = z.object({
    prioridade: z.enum(['normal', 'alta', 'urgente']).optional(),
    documents: z.array(z.object({
        type: z.enum(['crlv', 'antt', 'cnh', 'endereco', 'bancario', 'pamcard', 'gr', 'rcv', 'doc_prop', 'end_prop', 'outros']),
        customDescription: z.string().optional(),
        fileId: z.string(), // ID do arquivo já uploadado
    })).optional(),
});

const updateStatusSchema = z.object({
    status: z.enum(['pendente', 'em_analise', 'aprovado', 'rejeitado']),
    motivoRejeicao: z.string().optional(),
});

/**
 * POST /api/submissions
 * Cria nova submissão de cadastro
 */
router.post('/', authenticate, requirePermission('criarCadastros'), asyncHandler(async (req: Request, res: Response) => {
    const data = createSubmissionSchema.parse(req.body);

    const submission = await submissionService.createSubmission({
        operador_id: req.user!.id,
        prioridade: data.prioridade || 'normal',
        status: 'pendente',
        atribuido_a: null,
        started_at: null,
        finished_at: null,
        motivo_rejeicao: null,
    });

    // Log
    await auditService.createLog({
        usuario_id: req.user!.id,
        usuario_nome: req.user!.name,
        tipo: 'CRIAR',
        modulo: 'Cadastro GR',
        descricao: `Nova submissão criada`,
        detalhes: { submissionId: submission.id, prioridade: submission.prioridade },
        ip: req.ip || null,
    });

    // Notificar via WebSocket
    io.emit('submission:new', {
        id: submission.id,
        operador: req.user!.name,
        prioridade: submission.prioridade,
    });

    res.status(201).json({
        success: true,
        data: submission,
    });
}));

/**
 * GET /api/submissions
 * Lista fila de submissões
 */
router.get('/', authenticate, requirePermission('viewDashboardCadastroGR'), asyncHandler(async (req: Request, res: Response) => {
    const { status, prioridade, limit, offset } = req.query;

    const filters: submissionService.SubmissionFilters = {
        limit: limit ? parseInt(limit as string) : 100,
        offset: offset ? parseInt(offset as string) : 0,
    };

    if (status) {
        filters.status = (status as string).split(',') as any;
    }

    if (prioridade) {
        filters.prioridade = (prioridade as string).split(',') as any;
    }

    const { submissions, total } = await submissionService.getSubmissions(filters);

    // Adicionar tempo de espera formatado
    const submissionsWithTime = submissions.map(sub => ({
        ...sub,
        tempo_espera: submissionService.formatarTempoEspera(
            submissionService.calcularTempoEspera(sub.created_at, sub.finished_at)
        ),
    }));

    res.json({
        success: true,
        data: {
            submissions: submissionsWithTime,
            total,
            page: Math.floor((filters.offset || 0) / (filters.limit || 100)) + 1,
            pageSize: filters.limit || 100,
        },
    });
}));

/**
 * GET /api/submissions/:id
 * Detalhes de uma submissão
 */
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const submission = await submissionService.getSubmissionWithDetails(id);

    if (!submission) {
        throw Errors.NotFound('Submissão');
    }

    // Buscar documentos
    const documents = await documentService.getDocumentsBySubmission(id);
    const groupedDocs = documentService.groupDocumentsByType(documents);

    res.json({
        success: true,
        data: {
            ...submission,
            tempo_espera: submissionService.formatarTempoEspera(
                submissionService.calcularTempoEspera(submission.created_at, submission.finished_at)
            ),
            documents,
            documents_grouped: groupedDocs,
        },
    });
}));

/**
 * PATCH /api/submissions/:id/status
 * Atualiza status (pendente → em_analise → aprovado/rejeitado)
 */
router.patch('/:id/status', authenticate, requirePermission('aprovarCadastros'), asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, motivoRejeicao } = updateStatusSchema.parse(req.body);

    const submission = await submissionService.getSubmissionById(id);

    if (!submission) {
        throw Errors.NotFound('Submissão');
    }

    // Validar transição de status
    const validTransitions: Record<string, string[]> = {
        pendente: ['em_analise', 'rejeitado'],
        em_analise: ['aprovado', 'rejeitado', 'pendente'],
        aprovado: [],
        rejeitado: ['pendente'],
    };

    if (!validTransitions[submission.status].includes(status)) {
        throw Errors.BadRequest(`Transição inválida: ${submission.status} → ${status}`);
    }

    const updated = await submissionService.updateSubmissionStatus(
        id,
        status,
        req.user!.id,
        motivoRejeicao
    );

    // Log
    const logTipo = status === 'aprovado' ? 'APROVAR' : status === 'rejeitado' ? 'REJEITAR' : 'EDITAR';
    await auditService.createLog({
        usuario_id: req.user!.id,
        usuario_nome: req.user!.name,
        tipo: logTipo,
        modulo: 'Cadastro GR',
        descricao: `Submissão ${status === 'aprovado' ? 'aprovada' : status === 'rejeitado' ? 'rejeitada' : 'em análise'}`,
        detalhes: { submissionId: id, oldStatus: submission.status, newStatus: status },
        ip: req.ip || null,
    });

    // Notificar via WebSocket
    io.emit('submission:updated', {
        id,
        status,
        updatedBy: req.user!.name,
    });

    res.json({
        success: true,
        data: updated,
    });
}));

/**
 * GET /api/submissions/:id/documents
 * Lista documentos de uma submissão
 */
router.get('/:id/documents', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const submission = await submissionService.getSubmissionById(id);

    if (!submission) {
        throw Errors.NotFound('Submissão');
    }

    const documents = await documentService.getDocumentsBySubmission(id);
    const grouped = documentService.groupDocumentsByType(documents);

    res.json({
        success: true,
        data: {
            documents,
            grouped,
            total: documents.length,
        },
    });
}));

export default router;
