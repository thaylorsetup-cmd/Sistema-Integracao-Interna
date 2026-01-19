-- =====================================================
-- MIGRACAO 001: TABELA DE USUARIOS
-- =====================================================

-- Extensao para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum para roles
CREATE TYPE user_role AS ENUM ('admin', 'gestor', 'operacional', 'cadastro', 'comercial');

-- Tabela de usuarios
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    nome VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'operacional',
    ativo BOOLEAN DEFAULT TRUE,
    filial_id VARCHAR(50),
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice para busca por email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Indice para busca por role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Indice para usuarios ativos
CREATE INDEX IF NOT EXISTS idx_users_ativo ON users(ativo) WHERE ativo = TRUE;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
