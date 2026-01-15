/**
 * Script de Migração - Executa todas as migrations
 */

import fs from 'fs';
import path from 'path';
import { pool } from '../config/database.js';
import { logger } from '../config/logger.js';

const MIGRATIONS_DIR = path.join(import.meta.dirname, 'migrations');

async function runMigrations() {
    const client = await pool.connect();

    try {
        logger.info('🔄 Iniciando migrações...');

        // Ler arquivos de migração em ordem
        const files = fs.readdirSync(MIGRATIONS_DIR)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            const filePath = path.join(MIGRATIONS_DIR, file);
            const sql = fs.readFileSync(filePath, 'utf-8');

            logger.info(`Executando: ${file}`);
            await client.query(sql);
            logger.info(`✅ ${file} executado com sucesso`);
        }

        logger.info('🎉 Todas as migrações concluídas!');
    } catch (error) {
        logger.error('❌ Erro na migração:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations().catch(() => process.exit(1));
