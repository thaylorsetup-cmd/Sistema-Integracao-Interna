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
export const pool = new Pool({
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  max: 20, // Maximo de conexoes
  idleTimeoutMillis: 30000, // Timeout de conexao ociosa
  connectionTimeoutMillis: 2000, // Timeout de conexao
});

// Eventos do pool
pool.on('connect', () => {
  logger.debug('Nova conexao PostgreSQL estabelecida');
});

pool.on('error', (err) => {
  logger.error('Erro no pool PostgreSQL:', err);
});

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
