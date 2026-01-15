-- ============================================================
-- MIGRAÇÃO 002: Tabela de Submissões (Fila de Cadastros)
-- BBT Connect Backend
-- ============================================================
-- Tipo enum para status de submissão
CREATE TYPE submission_status AS ENUM (
    'pendente',
    'em_analise',
    'aprovado',
    'rejeitado'
);
-- Tipo enum para prioridade
CREATE TYPE submission_priority AS ENUM ('normal', 'alta', 'urgente');
-- Tabela de submissões
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operador_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    atribuido_a UUID REFERENCES users(id) ON DELETE
    SET NULL,
        status submission_status NOT NULL DEFAULT 'pendente',
        prioridade submission_priority NOT NULL DEFAULT 'normal',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP WITH TIME ZONE,
        finished_at TIMESTAMP WITH TIME ZONE,
        motivo_rejeicao TEXT
);
-- Índices
CREATE INDEX idx_submissions_operador ON submissions(operador_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_prioridade ON submissions(prioridade);
CREATE INDEX idx_submissions_created_at ON submissions(created_at);