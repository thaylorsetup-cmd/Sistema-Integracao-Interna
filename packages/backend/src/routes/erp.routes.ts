/**
 * Rotas de integração com ERP SSW
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, Errors } from '../middlewares/error.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import * as erpService from '../config/erp.js';
import { logger } from '../config/logger.js';

const router = Router();

/**
 * GET /api/erp/status
 * Verifica status da conexão com ERP
 */
router.get('/status', authenticate, asyncHandler(async (req: Request, res: Response) => {
    try {
        await erpService.connectERP();
        res.json({
            success: true,
            data: {
                connected: true,
                host: '177.136.206.200',
                database: 'DBExpress',
            },
        });
    } catch (error) {
        res.json({
            success: true,
            data: {
                connected: false,
                error: 'Falha na conexão com ERP',
            },
        });
    }
}));

/**
 * GET /api/erp/coletas
 * Lista coletas do ERP
 */
router.get('/coletas', authenticate, requirePermission('viewDashboardOperador'), asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 100;

    try {
        const coletas = await erpService.getColetasERP(limit);

        res.json({
            success: true,
            data: coletas,
        });
    } catch (error) {
        logger.error('Erro ao buscar coletas do ERP:', error);
        throw Errors.InternalError('Erro ao consultar ERP');
    }
}));

/**
 * GET /api/erp/motoristas
 * Lista motoristas do ERP
 */
router.get('/motoristas', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;

    try {
        const motoristas = await erpService.getMotoristasERP(search);

        res.json({
            success: true,
            data: motoristas,
        });
    } catch (error) {
        logger.error('Erro ao buscar motoristas do ERP:', error);
        throw Errors.InternalError('Erro ao consultar ERP');
    }
}));

/**
 * GET /api/erp/veiculos
 * Lista veículos do ERP
 */
router.get('/veiculos', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const placa = req.query.placa as string | undefined;

    try {
        const veiculos = await erpService.getVeiculosERP(placa);

        res.json({
            success: true,
            data: veiculos,
        });
    } catch (error) {
        logger.error('Erro ao buscar veículos do ERP:', error);
        throw Errors.InternalError('Erro ao consultar ERP');
    }
}));

export default router;
