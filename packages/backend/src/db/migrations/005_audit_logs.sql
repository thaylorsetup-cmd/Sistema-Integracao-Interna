-- =====================================================
-- MIGRACAO 005: TABELA DE LOGS DE AUDITORIA
-- =====================================================

-- Tabela de audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Quem fez a acao
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    user_nome VARCHAR(255),

    -- Acao realizada
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(100) NOT NULL,
    entidade_id UUID,

    -- Detalhes da mudanca
    dados_anteriores JSONB,
    dados_novos JSONB,

    -- Contexto
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_acao ON audit_logs(acao);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entidade ON audit_logs(entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Indice para busca em JSONB
CREATE INDEX IF NOT EXISTS idx_audit_logs_dados_gin
    ON audit_logs USING GIN (dados_novos);
