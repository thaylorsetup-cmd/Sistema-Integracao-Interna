/**
 * BBT Connect Backend - Entry Point
 * Sistema de Gestão de Transportes
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config/env.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { logger } from './config/logger.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import documentsRoutes from './routes/documents.routes.js';
import submissionsRoutes from './routes/submissions.routes.js';
import logsRoutes from './routes/logs.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import kpisRoutes from './routes/kpis.routes.js';
import erpRoutes from './routes/erp.routes.js';

const app = express();
const httpServer = createServer(app);

// Socket.IO para tempo real
export const io = new SocketIOServer(httpServer, {
    cors: {
        origin: config.CORS_ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Middlewares globais
app.use(helmet());
app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/kpis', kpisRoutes);
app.use('/api/erp', erpRoutes);

// Error handler (deve ser o último)
app.use(errorHandler);

// Socket.IO events
io.on('connection', (socket) => {
    logger.info(`Cliente conectado: ${socket.id}`);

    socket.on('join:user', (userId: string) => {
        socket.join(`user:${userId}`);
        logger.info(`Usuário ${userId} entrou na sala`);
    });

    socket.on('disconnect', () => {
        logger.info(`Cliente desconectado: ${socket.id}`);
    });
});

// Iniciar servidor
const PORT = config.PORT || 3001;

httpServer.listen(PORT, () => {
    logger.info(`🚀 BBT Connect Backend rodando na porta ${PORT}`);
    logger.info(`📡 WebSocket disponível`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

export { app, httpServer };
