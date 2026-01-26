/**
 * Configuracao de Variaveis de Ambiente
 * Validacao com Zod para garantir que todas as variaveis obrigatorias existem
 */
import { z } from 'zod';
import dotenv from 'dotenv';

// Carregar .env
dotenv.config();

// Schema de validacao
const envSchema = z.object({
  // Servidor
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  BASE_URL: z.string().default('http://localhost:3001'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // PostgreSQL
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_DB: z.string().default('bbt_connect'),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().default('postgres'),

  // SMTP (Email)
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('BBT Connect <chat.bbttransportes@gmail.com>'),

  // Uploads
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(52428800), // 50MB

  // Logs
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Rate Limit
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000), // 1 minuto
  RATE_LIMIT_MAX: z.coerce.number().default(100), // 100 requests
});

// Validar e exportar
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Erro nas variaveis de ambiente:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

// Tipo para uso em outros arquivos
export type Env = z.infer<typeof envSchema>;
