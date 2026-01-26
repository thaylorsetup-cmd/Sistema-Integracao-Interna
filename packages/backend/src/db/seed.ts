/**
 * Seed do Banco de Dados
 * Cria usuarios iniciais conforme planilha USUARIOS.xlsx
 */
import { db } from '../config/database.js';
import { logger } from '../config/logger.js';

// Usuarios da planilha USUARIOS.xlsx
const initialUsers = [
  {
    email: 'ti.mtz@bbttransportes.com.br',
    nome: 'Luciano Alves',
    password: 'bbt@2026',
    role: 'admin' as const,
  },
  {
    email: 'agregados.mtz@bbttransportes.com.br',
    nome: 'Sidney Ferreira',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'agenciadora@bbttransportes.com.br',
    nome: 'Agenciadora',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'comercial01.sao@bbttransportes.com.br',
    nome: 'Mariana Figueiredo',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'comercial02.sao@bbttransportes.com.br',
    nome: 'Maycon Douglas',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'operacional.sao@bbttransportes.com.br',
    nome: 'Evandro William Avigo',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'operacional.mtz@bbttransportes.com.br',
    nome: 'Edcarlos Antonio',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'marcius.fleury@bbttransportes.com.br',
    nome: 'Marcius Fleury',
    password: 'bbt@2026',
    role: 'admin' as const,
  },
  {
    email: 'gr.mtz01@bbttransportes.com.br',
    nome: 'Jordana Alves',
    password: 'bbt@2026',
    role: 'cadastro' as const,
  },
  {
    email: 'gr.mtz02@bbttransportes.com.br',
    nome: 'Jullia de Oliveira',
    password: 'bbt@2026',
    role: 'cadastro' as const,
  },
  {
    email: 'gr.mtz03@bbttransportes.com.br',
    nome: 'Geovanna',
    password: 'bbt@2026',
    role: 'cadastro' as const,
  },
  {
    email: 'operacional01.gyn@bbttransportes.com.br',
    nome: 'Igor Costa',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'operacional01.mtz@bbttransportes.com.br',
    nome: 'Tainallys Ferreira',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'operacional02.gyn@bbttransportes.com.br',
    nome: 'Danubia de Sousa',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'operacional04.mtz@bbttransportes.com.br',
    nome: 'Maria Paula',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'operacional05.mtz@bbttransportes.com.br',
    nome: 'Mariane Sa',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'operacional09.mtz@bbttransportes.com.br',
    nome: 'Miqueias Macedo',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'comercial03.gyn@bbttransportes.com.br',
    nome: 'Bruno Ribeiro',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'gestor.mtz@b4comex.com.br',
    nome: 'Julia Cavalcante',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'operacional.comex@bbttransportes.com.br',
    nome: 'Operacao COMEX',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'comercial.comex@bbttransportes.com.br',
    nome: 'Comercial COMEX',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'coletas.gyn@bbttransportes.com.br',
    nome: 'Victor Saraiva',
    password: 'bbt@2026',
    role: 'operacional' as const,
  },
  {
    email: 'operacional.gyn@bbttransportes.com.br',
    nome: 'Roberta Alves',
    password: 'bbt@2026',
    role: 'operacional' as const,
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
        // Atualizar senha e dados se usuario ja existe
        await db
          .updateTable('users')
          .set({
            password: user.password,
            nome: user.nome,
            role: user.role,
            ativo: true,
          })
          .where('email', '=', user.email)
          .execute();
        logger.info(`Usuario atualizado: ${user.email}`);
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
