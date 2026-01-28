/**
 * Configuracao do Banco de Dados PostgreSQL com Kysely
 */
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { env } from './env.js';
import { logger } from './logger.js';
import type { Database } from '../types/database.js';

const { Pool } = pg;

// Pool de conexoes PostgreSQL
// Configurado para suportar 10-20 usuarios simultaneos
export const pool = new Pool({
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  max: 25, // Aumentado de 20 para 25 conexoes (ideal para 10-20 usuarios)
  min: 5, // Manter 5 conexoes sempre ativas
  idleTimeoutMillis: 30000, // Fechar conexoes idle apos 30s
  connectionTimeoutMillis: 5000, // Timeout de conexao em 5s (aumentado de 2s)
  allowExitOnIdle: false, // Nao fechar pool automaticamente
});

// Eventos do pool
pool.on('connect', () => {
  logger.debug('Nova conexao PostgreSQL estabelecida');
});

pool.on('error', (err) => {
  logger.error('Erro no pool PostgreSQL:', err);
});

// Log de metricas do pool a cada 1 minuto (util para monitoramento)
setInterval(() => {
  logger.debug('Pool stats:', {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  });
}, 60000); // Log a cada 1 minuto

// Instancia Kysely
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool,
  }),
});

// Funcao para verificar conexao
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info(`Conexao com PostgreSQL OK: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    logger.error('Falha na conexao com PostgreSQL:', error);
    return false;
  }
}

// Funcao para fechar conexoes
export async function closeDatabaseConnection(): Promise<void> {
  await db.destroy();
  await pool.end();
  logger.info('Conexoes PostgreSQL encerradas');
}
