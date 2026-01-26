/**
 * BBT Connect Backend
 * Entry point da aplicacao
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';

import { env } from './config/env.js';
import { logger, morganStream } from './config/logger.js';
import { checkDatabaseConnection, closeDatabaseConnection, pool } from './config/database.js';
import { initializeSocket } from './socket/index.js';
import { defaultRateLimiter } from './middlewares/rate-limit.middleware.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import routes from './routes/index.js';

// Criar app Express
const app = express();
const httpServer = createServer(app);

// Inicializar Socket.IO
initializeSocket(httpServer);

// Middlewares de seguranca
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

// Cookie parser
app.use(cookieParser());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging HTTP
if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: morganStream }));
}

// Rate limiting global
app.use(defaultRateLimiter);

// Trust proxy (para rate limit funcionar corretamente atras de nginx/docker)
app.set('trust proxy', 1);

// Health check (sem autenticacao)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'BBT Connect API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: env.NODE_ENV,
  });
});

// Rotas da API
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler global
app.use(errorHandler);

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info(`${signal} recebido. Iniciando shutdown graceful...`);

  httpServer.close(async () => {
    logger.info('HTTP server fechado');

    await closeDatabaseConnection();
    logger.info('Conexoes de banco fechadas');

    process.exit(0);
  });

  // Forcar saida apos 30 segundos
  setTimeout(() => {
    logger.error('Shutdown forcado apos timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

import { runMigrations } from './db/migrate.js';
import { seed } from './db/seed.js';

// Iniciar servidor
async function start() {
  try {
    // Verificar conexao com banco
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      logger.error('Falha na conexao com banco de dados');
      process.exit(1);
    }

    // Executar migracoes automaticas
    try {
      await runMigrations();
    } catch (error) {
      logger.error('Falha ao executar migracoes automaticas:', error);
      process.exit(1);
    }

    // Auto-seed: criar usuarios iniciais se tabela estiver vazia
    try {
      const userCountResult = await pool.query('SELECT COUNT(*) FROM users');
      const userCount = parseInt(userCountResult.rows[0].count, 10);
      if (userCount === 0) {
        logger.info('Nenhum usuario encontrado. Executando seed automatico...');
        await seed();
      } else {
        logger.info(`${userCount} usuario(s) encontrado(s). Seed nao necessario.`);
      }
    } catch (error) {
      logger.warn('Aviso: Falha no auto-seed (nao bloqueia inicializacao):', error);
    }

    // Iniciar HTTP server
    httpServer.listen(env.PORT, () => {
      logger.info(`
========================================
  BBT Connect Backend v1.0.0
========================================
  Environment: ${env.NODE_ENV}
  Port: ${env.PORT}
  CORS Origin: ${env.CORS_ORIGIN}
  Database: ${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}
========================================
      `);
    });
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

start();
