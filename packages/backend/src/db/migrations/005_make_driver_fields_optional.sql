-- =====================================================
-- MIGRACAO 005: TORNAR CAMPOS DE MOTORISTA OPCIONAIS
-- =====================================================
-- Alterar colunas para permitir NULL
ALTER TABLE submissions
ALTER COLUMN nome_motorista DROP NOT NULL;
ALTER TABLE submissions
ALTER COLUMN cpf DROP NOT NULL;