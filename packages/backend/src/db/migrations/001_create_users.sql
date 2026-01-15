-- ============================================================
-- MIGRAÇÃO 001: Tabela de Usuários
-- BBT Connect Backend
-- ============================================================
-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Tipo enum para roles
CREATE TYPE user_role AS ENUM (
    'admin',
    'gestor',
    'operacional',
    'cadastro',
    'comercial'
);
-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'operacional',
    departamento VARCHAR(100) NOT NULL,
    avatar VARCHAR(500),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_ativo ON users(ativo);
-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_users_updated_at BEFORE
UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();