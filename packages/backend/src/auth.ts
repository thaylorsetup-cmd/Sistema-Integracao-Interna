/**
 * Configuracao Better-Auth
 * Autenticacao baseada em sessoes com cookies
 */
import { betterAuth } from 'better-auth';
import { pool } from './config/database.js';
import { env } from './config/env.js';

export const auth = betterAuth({
  database: pool,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BASE_URL,

  // Configuracao de sessao
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    updateAge: 60 * 60 * 24, // Renova a cada 1 dia
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache de 5 minutos
    },
  },

  // Autenticacao por email/senha
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    window: env.RATE_LIMIT_WINDOW_MS / 1000, // Converter para segundos
    max: env.RATE_LIMIT_MAX,
  },

  // Configuracao de cookies
  advanced: {
    cookiePrefix: 'bbt_connect',
    useSecureCookies: env.NODE_ENV === 'production',
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: env.NODE_ENV === 'production',
    },
  },

  // Campos adicionais do usuario
  user: {
    additionalFields: {
      nome: {
        type: 'string',
        required: true,
      },
      role: {
        type: 'string',
        required: true,
        defaultValue: 'operacional',
      },
      ativo: {
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
      filialId: {
        type: 'string',
        required: false,
      },
      avatar: {
        type: 'string',
        required: false,
      },
    },
  },

  // Callbacks
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Garantir que novos usuarios tenham role padrao
          return {
            data: {
              ...user,
              role: user.role || 'operacional',
              ativo: user.ativo !== undefined ? user.ativo : true,
            },
          };
        },
      },
    },
  },
});

// Tipo do auth para uso em outros arquivos
export type Auth = typeof auth;
