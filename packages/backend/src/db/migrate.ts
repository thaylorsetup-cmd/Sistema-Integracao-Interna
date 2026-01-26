/**
 * Script de Migracao do Banco de Dados
 * Executa as migracoes SQL em ordem
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export async function runMigrations() {
  logger.info('Iniciando migracoes do banco de dados...');

  try {
    // Verificar conexao (usando client temporario para nao afetar pool global se necessario)
    // Mas aqui usaremos o pool importado

    // Criar tabela de controle de migracoes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Buscar migracoes ja executadas
    const result = await pool.query('SELECT name FROM _migrations ORDER BY id');
    const executed = new Set(result.rows.map((row) => row.name));

    // Ler arquivos de migracao
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    logger.info(`Encontradas ${files.length} migracoes no diretorio: ${MIGRATIONS_DIR}`);

    // Executar migracoes pendentes
    for (const file of files) {
      if (executed.has(file)) {
        logger.debug(`Migracao ${file} ja executada`);
        continue;
      }

      logger.info(`Executando migracao: ${file}`);

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Executar em transacao
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');

        logger.info(`Migracao ${file} concluida`);
      } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`Erro na migracao ${file}:`, error);
        throw error;
      } finally {
        client.release();
      }
    }

    logger.info('Migracoes concluidas com sucesso!');
    return true;
  } catch (error) {
    logger.error('Falha critica nas migracoes:', error);
    throw error;
  }
}

// Executar se chamado diretamente pelo node/tsx
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runMigrations()
    .then(() => pool.end())
    .catch(() => process.exit(1));
}
