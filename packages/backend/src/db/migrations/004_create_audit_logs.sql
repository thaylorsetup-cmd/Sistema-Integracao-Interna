-- ============================================================
-- MIGRAÇÃO 004: Tabela de Logs de Auditoria
-- BBT Connect Backend
-- ============================================================
-- Tipo enum para tipos de log
CREATE TYPE log_type AS ENUM (
    'LOGIN',
    'LOGOUT',
    'CRIAR',
    'EDITAR',
    'DELETAR',
    'APROVAR',
    'REJEITAR',
    'VISUALIZAR',
    'EXPORTAR',
    'CONFIG'
);
-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usuario_nome VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tipo log_type NOT NULL,
    modulo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    detalhes JSONB,
    ip VARCHAR(50)
);
-- Índices
CREATE INDEX idx_audit_logs_usuario ON audit_logs(usuario_id);
CREATE INDEX idx_audit_logs_tipo ON audit_logs(tipo);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_modulo ON audit_logs(modulo);