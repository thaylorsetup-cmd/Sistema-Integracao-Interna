/**
 * Seed do Banco de Dados
 * Cria usuarios iniciais para testes
 */
import { db } from '../config/database.js';
import { logger } from '../config/logger.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Usuarios iniciais
const initialUsers = [
  {
    email: 'admin@bbt.com',
    nome: 'Administrador',
    role: 'admin' as const,
    password: 'bbt@2024',
  },
  {
    email: 'gestor@bbt.com',
    nome: 'Gestor Operacional',
    role: 'gestor' as const,
    password: 'bbt@2024',
  },
  {
    email: 'operador@bbt.com',
    nome: 'Operador',
    role: 'operacional' as const,
    password: 'bbt@2024',
  },
  {
    email: 'cadastro@bbt.com',
    nome: 'Analista de Cadastro',
    role: 'cadastro' as const,
    password: 'bbt@2024',
  },
  {
    email: 'comercial@bbt.com',
    nome: 'Comercial',
    role: 'comercial' as const,
    password: 'bbt@2024',
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
        logger.info(`Usuario ${user.email} ja existe, pulando...`);
        continue;
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

      // Criar usuario
      const newUser = await db
        .insertInto('users')
        .values({
          email: user.email,
          nome: user.nome,
          role: user.role,
          email_verified: true,
          ativo: true,
        })
        .returning(['id', 'email'])
        .executeTakeFirst();

      if (newUser) {
        // Criar account com senha (better-auth)
        await db
          .insertInto('account')
          .values({
            id: `credential_${newUser.id}`,
            user_id: newUser.id,
            account_id: newUser.id,
            provider_id: 'credential',
            password: passwordHash,
          })
          .execute();

        logger.info(`Usuario criado: ${user.email} (${user.role})`);
      }
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
