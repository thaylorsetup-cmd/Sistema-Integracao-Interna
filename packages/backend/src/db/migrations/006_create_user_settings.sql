-- ============================================================
-- MIGRAÇÃO 006: Tabela de Configurações de Usuário
-- BBT Connect Backend
-- ============================================================
-- Tabela de configurações de usuário
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tema VARCHAR(20) NOT NULL DEFAULT 'dark',
    idioma VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    notif_email BOOLEAN NOT NULL DEFAULT true,
    notif_whatsapp BOOLEAN NOT NULL DEFAULT true,
    notif_push BOOLEAN NOT NULL DEFAULT true,
    som_notificacoes BOOLEAN NOT NULL DEFAULT true
);
-- Índice
CREATE INDEX idx_user_settings_usuario ON user_settings(usuario_id);