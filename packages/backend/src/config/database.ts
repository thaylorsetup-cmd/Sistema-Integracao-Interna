/**
 * Conexão com PostgreSQL usando Kysely
 */

import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { config } from './env.js';
import { logger } from './logger.js';
import type { Database } from '../types/database.js';

const pool = new Pool({
    host: config.POSTGRES_HOST,
    port: config.POSTGRES_PORT,
    database: config.POSTGRES_DB,
    user: config.POSTGRES_USER,
    password: config.POSTGRES_PASSWORD,
    max: 20, // Suporta 20 conexões simultâneas
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
    logger.debug('Nova conexão PostgreSQL estabelecida');
});

pool.on('error', (err) => {
    logger.error('Erro no pool PostgreSQL:', err);
});

export const db = new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
});

export async function testConnection(): Promise<boolean> {
    try {
        const result = await db.selectFrom('users').select('id').limit(1).execute();
        logger.info('✅ Conexão PostgreSQL OK');
        return true;
    } catch (error) {
        logger.error('❌ Falha na conexão PostgreSQL:', error);
        return false;
    }
}

export { pool };
