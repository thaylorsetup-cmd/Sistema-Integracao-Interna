/**
 * Rotas de Configurações
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, Errors } from '../middlewares/error.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/permission.middleware.js';
import { db } from '../config/database.js';
import * as auditService from '../services/audit.service.js';

const router = Router();

// Schemas
const userSettingsSchema = z.object({
    tema: z.enum(['dark', 'light', 'system']).optional(),
    idioma: z.enum(['pt-BR', 'en-US', 'es-ES']).optional(),
    notif_email: z.boolean().optional(),
    notif_whatsapp: z.boolean().optional(),
    notif_push: z.boolean().optional(),
    som_notificacoes: z.boolean().optional(),
});

/**
 * GET /api/settings/user
 * Retorna configurações do usuário logado
 */
router.get('/user', authenticate, asyncHandler(async (req: Request, res: Response) => {
    let settings = await db
        .selectFrom('user_settings')
        .selectAll()
        .where('usuario_id', '=', req.user!.id)
        .executeTakeFirst();

    // Se não existir, criar com padrões
    if (!settings) {
        [settings] = await db
            .insertInto('user_settings')
            .values({
                usuario_id: req.user!.id,
                tema: 'dark',
                idioma: 'pt-BR',
                notif_email: true,
                notif_whatsapp: true,
                notif_push: true,
                som_notificacoes: true,
            })
            .returningAll()
            .execute();
    }

    res.json({
        success: true,
        data: settings,
    });
}));

/**
 * PUT /api/settings/user
 * Atualiza configurações do usuário logado
 */
router.put('/user', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const data = userSettingsSchema.parse(req.body);

    // Verificar se já existe
    const existing = await db
        .selectFrom('user_settings')
        .select('id')
        .where('usuario_id', '=', req.user!.id)
        .executeTakeFirst();

    let settings;

    if (existing) {
        [settings] = await db
            .updateTable('user_settings')
            .set(data)
            .where('usuario_id', '=', req.user!.id)
            .returningAll()
            .execute();
    } else {
        [settings] = await db
            .insertInto('user_settings')
            .values({
                usuario_id: req.user!.id,
                tema: data.tema || 'dark',
                idioma: data.idioma || 'pt-BR',
                notif_email: data.notif_email ?? true,
                notif_whatsapp: data.notif_whatsapp ?? true,
                notif_push: data.notif_push ?? true,
                som_notificacoes: data.som_notificacoes ?? true,
            })
            .returningAll()
            .execute();
    }

    // Log
    await auditService.createLog({
        usuario_id: req.user!.id,
        usuario_nome: req.user!.name,
        tipo: 'CONFIG',
        modulo: 'Configurações',
        descricao: 'Configurações pessoais atualizadas',
        ip: req.ip || null,
    });

    res.json({
        success: true,
        data: settings,
    });
}));

/**
 * GET /api/settings/system
 * Retorna configurações do sistema (somente admin)
 */
router.get('/system', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
    // Por enquanto retorna configurações estáticas
    // Em produção, viria de uma tabela system_settings
    res.json({
        success: true,
        data: {
            nomeEmpresa: 'BBT Transportes',
            logoUrl: '/logo.png',
            corPrimaria: '#3b82f6',
            corSecundaria: '#1e293b',
            emailSuporte: 'suporte@bbttransportes.com.br',
            whatsappSuporte: '5562999892013',
        },
    });
}));

export default router;
