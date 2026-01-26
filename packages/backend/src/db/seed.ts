/**
 * Seed do Banco de Dados
 * Cria usuarios iniciais para testes
 */
import { db } from '../config/database.js';
import { logger } from '../config/logger.js';

// Usuarios iniciais com senha simples (ambiente interno)
const initialUsers = [
  {
    email: 'admin@bbt.com',
    nome: 'Administrador',
    password: 'admin123',
    role: 'admin' as const,
  },
  {
    email: 'gestor@bbt.com',
    nome: 'Gestor Operacional',
    password: 'bbt123',
    role: 'gestor' as const,
  },
  {
    email: 'operador@bbt.com',
    nome: 'Operador',
    password: 'bbt123',
    role: 'operacional' as const,
  },
  {
    email: 'cadastro@bbt.com',
    nome: 'Analista de Cadastro',
    password: 'bbt123',
    role: 'cadastro' as const,
  },
  {
    email: 'comercial@bbt.com',
    nome: 'Comercial',
    password: 'bbt123',
    role: 'comercial' as const,
  },
];

export async function seed() {
  logger.info('Iniciando seed do banco de dados...');

  try {
    for (const user of initialUsers) {
      // Verificar se usuario ja existe
      const existing = await db
        .selectFrom('users')
        .where('email', '=', user.email)
        .selectAll()
        .executeTakeFirst();

      if (existing) {
        // Atualizar senha se usuario ja existe
        await db
          .updateTable('users')
          .set({ password: user.password })
          .where('email', '=', user.email)
          .execute();
        logger.info(`Senha atualizada para: ${user.email}`);
        continue;
      }

      // Criar usuario
      await db
        .insertInto('users')
        .values({
          email: user.email,
          nome: user.nome,
          password: user.password,
          role: user.role,
          email_verified: true,
          ativo: true,
        })
        .returning(['id', 'email'])
        .executeTakeFirst();

      logger.info(`Usuario criado: ${user.email} (${user.role})`);
    }

    logger.info('Seed concluido com sucesso!');
  } catch (error) {
    logger.error('Erro no seed:', error);
    throw error;
  }
}

// Executar se chamado diretamente
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

