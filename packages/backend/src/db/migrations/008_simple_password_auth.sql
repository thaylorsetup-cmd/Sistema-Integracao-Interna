-- =====================================================
-- MIGRACAO 008: AUTH SIMPLES COM SENHA
-- Sistema interno - senha em texto simples
-- =====================================================
-- Adicionar coluna de senha na tabela users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password VARCHAR(100);
-- Definir senha padrao para usuarios existentes (trocar depois)
UPDATE users
SET password = 'bbt123'
WHERE password IS NULL;
-- Tornar a coluna obrigatoria apos definir valores
ALTER TABLE users
ALTER COLUMN password
SET NOT NULL;
-- Criar indice para busca por email (se nao existir)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);