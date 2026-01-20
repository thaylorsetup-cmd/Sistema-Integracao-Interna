/**
 * Agregador de Rotas
 * Centraliza todas as rotas da API
 */
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import filaRoutes from './fila.routes.js';
import documentsRoutes from './documents.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import ticketRoutes from './ticket.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'BBT Connect API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Rotas da API
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/fila', filaRoutes);
router.use('/documents', documentsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/tickets', ticketRoutes);

export default router;
