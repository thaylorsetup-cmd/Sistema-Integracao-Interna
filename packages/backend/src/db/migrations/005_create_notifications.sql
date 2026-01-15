-- ============================================================
-- MIGRAÇÃO 005: Tabela de Notificações
-- BBT Connect Backend
-- ============================================================
-- Tipo enum para tipos de notificação
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo notification_type NOT NULL DEFAULT 'info',
    lida BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX idx_notifications_usuario ON notifications(usuario_id);
CREATE INDEX idx_notifications_lida ON notifications(lida);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);