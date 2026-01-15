/**
 * Rotas de Logs de Auditoria
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, Errors } from '../middlewares/error.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import * as auditService from '../services/audit.service.js';
import type { LogType } from '../types/database.js';

const router = Router();

const logsQuerySchema = z.object({
    tipo: z.string().optional(),
    usuarioId: z.string().optional(),
    modulo: z.string().optional(),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
});

/**
 * GET /api/logs
 * Lista logs com filtros
 */
router.get('/', authenticate, requirePermission('viewAuditoria'), asyncHandler(async (req: Request, res: Response) => {
    const query = logsQuerySchema.parse(req.query);

    const filters: auditService.LogFilters = {
        limit: query.limit ? parseInt(query.limit) : 100,
        offset: query.offset ? parseInt(query.offset) : 0,
    };

    if (query.tipo) {
        filters.tipo = query.tipo.split(',') as LogType[];
    }

    if (query.usuarioId) {
        filters.usuarioId = query.usuarioId;
    }

    if (query.modulo) {
        filters.modulo = query.modulo;
    }

    if (query.dataInicio) {
        filters.dataInicio = new Date(query.dataInicio);
    }

    if (query.dataFim) {
        filters.dataFim = new Date(query.dataFim);
    }

    const { logs, total } = await auditService.getLogs(filters);

    res.json({
        success: true,
        data: {
            logs,
            total,
            page: Math.floor((filters.offset || 0) / (filters.limit || 100)) + 1,
            pageSize: filters.limit,
        },
    });
}));

/**
 * GET /api/logs/export
 * Exporta logs em CSV ou JSON
 */
router.get('/export', authenticate, requirePermission('exportAuditoria'), asyncHandler(async (req: Request, res: Response) => {
    const { format = 'json', ...queryRest } = req.query;
    const query = logsQuerySchema.parse(queryRest);

    const filters: auditService.LogFilters = {};

    if (query.tipo) {
        filters.tipo = query.tipo.split(',') as LogType[];
    }

    if (query.usuarioId) {
        filters.usuarioId = query.usuarioId;
    }

    if (query.modulo) {
        filters.modulo = query.modulo;
    }

    // Log da exportação
    await auditService.createLog({
        usuario_id: req.user!.id,
        usuario_nome: req.user!.name,
        tipo: 'EXPORTAR',
        modulo: 'Auditoria',
        descricao: `Exportação de logs em ${format}`,
        ip: req.ip || null,
    });

    if (format === 'csv') {
        const csv = await auditService.exportLogsCsv(filters);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=logs_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } else {
        const logs = await auditService.exportLogsJson(filters);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=logs_${new Date().toISOString().split('T')[0]}.json`);
        res.json(logs);
    }
}));

export default router;
