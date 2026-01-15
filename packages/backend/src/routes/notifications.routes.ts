/**
 * Rotas de Notificações
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, Errors } from '../middlewares/error.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { db } from '../config/database.js';
import { io } from '../index.js';

const router = Router();

/**
 * GET /api/notifications
 * Lista notificações do usuário logado
 */
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { unread } = req.query;

    let query = db
        .selectFrom('notifications')
        .selectAll()
        .where('usuario_id', '=', req.user!.id)
        .orderBy('created_at', 'desc')
        .limit(50);

    if (unread === 'true') {
        query = query.where('lida', '=', false);
    }

    const notifications = await query.execute();

    // Contar não lidas
    const unreadCount = await db
        .selectFrom('notifications')
        .select(db.fn.count('id').as('count'))
        .where('usuario_id', '=', req.user!.id)
        .where('lida', '=', false)
        .executeTakeFirst();

    res.json({
        success: true,
        data: {
            notifications,
            unreadCount: Number(unreadCount?.count || 0),
        },
    });
}));

/**
 * PATCH /api/notifications/:id/read
 * Marca notificação como lida
 */
router.patch('/:id/read', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const [notification] = await db
        .updateTable('notifications')
        .set({ lida: true })
        .where('id', '=', id)
        .where('usuario_id', '=', req.user!.id)
        .returningAll()
        .execute();

    if (!notification) {
        throw Errors.NotFound('Notificação');
    }

    res.json({
        success: true,
        data: notification,
    });
}));

/**
 * PATCH /api/notifications/read-all
 * Marca todas notificações como lidas
 */
router.patch('/read-all', authenticate, asyncHandler(async (req: Request, res: Response) => {
    await db
        .updateTable('notifications')
        .set({ lida: true })
        .where('usuario_id', '=', req.user!.id)
        .where('lida', '=', false)
        .execute();

    res.json({
        success: true,
        message: 'Todas as notificações marcadas como lidas',
    });
}));

/**
 * POST /api/notifications (interno)
 * Cria e envia notificação para um usuário
 */
export async function createNotification(
    usuarioId: string,
    titulo: string,
    mensagem: string,
    tipo: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
    const [notification] = await db
        .insertInto('notifications')
        .values({
            usuario_id: usuarioId,
            titulo,
            mensagem,
            tipo,
            lida: false,
        })
        .returningAll()
        .execute();

    // Enviar via WebSocket
    io.to(`user:${usuarioId}`).emit('notification:new', notification);

    return notification;
}

export default router;
