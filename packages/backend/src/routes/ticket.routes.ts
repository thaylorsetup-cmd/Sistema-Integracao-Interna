/**
 * Rotas de Tickets de Suporte
 * Permite que usuários enviem tickets de ajuda
 */
import { Router, Request, Response } from 'express';
import { logger } from '../config/logger.js';

const router = Router();

// Tipos
interface TicketData {
    titulo: string;
    categoria: 'bug' | 'duvida' | 'sugestao' | 'outro';
    descricao: string;
    usuario?: {
        id?: string;
        nome?: string;
        email?: string;
    };
}

interface Ticket extends TicketData {
    id: string;
    status: 'aberto' | 'em_andamento' | 'resolvido';
    created_at: string;
}

// Armazenamento temporário em memória (pode ser substituído por banco depois)
const tickets: Ticket[] = [];

/**
 * POST /api/tickets
 * Cria um novo ticket de suporte
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const { titulo, categoria, descricao, usuario } = req.body as TicketData;

        // Validação
        if (!titulo || !titulo.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Título é obrigatório',
            });
        }

        if (!descricao || !descricao.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Descrição é obrigatória',
            });
        }

        const categoriasValidas = ['bug', 'duvida', 'sugestao', 'outro'];
        if (!categoria || !categoriasValidas.includes(categoria)) {
            return res.status(400).json({
                success: false,
                error: 'Categoria inválida',
            });
        }

        // Criar ticket
        const ticket: Ticket = {
            id: `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            titulo: titulo.trim(),
            categoria,
            descricao: descricao.trim(),
            usuario,
            status: 'aberto',
            created_at: new Date().toISOString(),
        };

        tickets.push(ticket);

        // Log para notificação (será visto no console)
        logger.info('========================================');
        logger.info('🎫 NOVO TICKET DE SUPORTE RECEBIDO');
        logger.info('========================================');
        logger.info(`ID: ${ticket.id}`);
        logger.info(`Título: ${ticket.titulo}`);
        logger.info(`Categoria: ${ticket.categoria}`);
        logger.info(`Descrição: ${ticket.descricao}`);
        if (ticket.usuario) {
            logger.info(`Usuário: ${ticket.usuario.nome || 'N/A'} (${ticket.usuario.email || 'N/A'})`);
        }
        logger.info(`Data: ${ticket.created_at}`);
        logger.info('========================================');

        return res.status(201).json({
            success: true,
            message: 'Ticket criado com sucesso! Nossa equipe irá analisar em breve.',
            data: ticket,
        });
    } catch (error) {
        logger.error('Erro ao criar ticket:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno ao criar ticket',
        });
    }
});

/**
 * GET /api/tickets
 * Lista todos os tickets (apenas para admin/debug)
 */
router.get('/', async (_req: Request, res: Response) => {
    try {
        return res.json({
            success: true,
            data: tickets,
            total: tickets.length,
        });
    } catch (error) {
        logger.error('Erro ao listar tickets:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno ao listar tickets',
        });
    }
});

export default router;
