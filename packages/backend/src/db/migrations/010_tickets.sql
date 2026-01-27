-- Migration 010: Tickets de Suporte
-- Cria tabela para persistir tickets enviados pela Central de Ajuda

CREATE TYPE ticket_status AS ENUM ('aberto', 'em_andamento', 'resolvido', 'fechado');
CREATE TYPE ticket_categoria AS ENUM ('bug', 'duvida', 'sugestao', 'outro');

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    categoria ticket_categoria NOT NULL DEFAULT 'duvida',
    descricao TEXT NOT NULL,
    status ticket_status NOT NULL DEFAULT 'aberto',
    usuario_id UUID REFERENCES users(id) ON DELETE SET NULL,
    usuario_nome VARCHAR(255),
    usuario_email VARCHAR(255),
    resposta TEXT,
    respondido_por UUID REFERENCES users(id) ON DELETE SET NULL,
    respondido_em TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_categoria ON tickets(categoria);
CREATE INDEX idx_tickets_usuario_id ON tickets(usuario_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);

-- Trigger para auto-update do updated_at
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
