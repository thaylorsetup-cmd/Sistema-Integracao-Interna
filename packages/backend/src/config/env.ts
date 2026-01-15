/**
 * Configurações de ambiente
 */

import dotenv from 'dotenv';
import path from 'path';

// Carregar .env do diretório raiz do projeto
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const config = {
    // Server
    PORT: parseInt(process.env.API_PORT || '3001', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',

    // CORS
    CORS_ORIGIN: process.env.CORS_ORIGIN || process.env.VITE_API_URL?.replace(':3001', ':5173') || 'http://localhost:5173',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'guardiao_jwt_secret_change_in_production_2024',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

    // PostgreSQL
    POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
    POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    POSTGRES_DB: process.env.POSTGRES_DB || 'guardiao_ai',
    POSTGRES_USER: process.env.POSTGRES_USER || 'guardiao',
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'guardiao_ai_2024',

    // SQL Server (ERP SSW)
    MSSQL_HOST: process.env.MSSQL_HOST || '177.136.206.200',
    MSSQL_PORT: parseInt(process.env.MSSQL_PORT || '1433', 10),
    MSSQL_DATABASE: process.env.MSSQL_DATABASE || 'DBExpress',
    MSSQL_USER: process.env.MSSQL_USER || 'mcp_readonly',
    MSSQL_PASSWORD: process.env.MSSQL_PASSWORD || '',
    MSSQL_ENCRYPT: process.env.MSSQL_ENCRYPT === 'true',
    MSSQL_TRUST_CERT: process.env.MSSQL_TRUST_CERT !== 'false',

    // Redis
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

    // Upload
    UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB

    // Logs
    LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
};
