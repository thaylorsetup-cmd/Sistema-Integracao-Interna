-- Migration 006: Workflow Enhancements
-- Add information fields for operators and delay tracking system

-- Add information fields to submissions table
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS origem VARCHAR(255),
ADD COLUMN IF NOT EXISTS destino VARCHAR(255),
ADD COLUMN IF NOT EXISTS localizacao_atual VARCHAR(255),
ADD COLUMN IF NOT EXISTS tipo_mercadoria VARCHAR(255),
ADD COLUMN IF NOT EXISTS categoria_rejeicao VARCHAR(100);

-- Create delays table for tracking delay reasons
CREATE TABLE IF NOT EXISTS delays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL,
    criado_por UUID NOT NULL REFERENCES users(id),
    criado_em TIMESTAMP DEFAULT NOW(),
    notificado BOOLEAN DEFAULT FALSE,
    notificado_em TIMESTAMP
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_delays_submission ON delays(submission_id);
CREATE INDEX IF NOT EXISTS idx_delays_criado_por ON delays(criado_por);
CREATE INDEX IF NOT EXISTS idx_delays_criado_em ON delays(criado_em DESC);

-- Add indices for new submission fields for better filtering
CREATE INDEX IF NOT EXISTS idx_submissions_origem ON submissions(origem);
CREATE INDEX IF NOT EXISTS idx_submissions_destino ON submissions(destino);
CREATE INDEX IF NOT EXISTS idx_submissions_tipo_mercadoria ON submissions(tipo_mercadoria);

-- Comment on table and columns for documentation
COMMENT ON TABLE delays IS 'Stores delay reasons for submissions with direct operator notifications';
COMMENT ON COLUMN delays.submission_id IS 'Reference to the submission with delay';
COMMENT ON COLUMN delays.motivo IS 'Reason for the delay';
COMMENT ON COLUMN delays.criado_por IS 'User who registered the delay';
COMMENT ON COLUMN delays.notificado IS 'Whether operator was notified';
COMMENT ON COLUMN delays.notificado_em IS 'Timestamp when operator was notified';

COMMENT ON COLUMN submissions.origem IS 'Origin location (city/state)';
COMMENT ON COLUMN submissions.destino IS 'Destination location (city/state)';
COMMENT ON COLUMN submissions.localizacao_atual IS 'Current driver location';
COMMENT ON COLUMN submissions.tipo_mercadoria IS 'Merchandise type (carga-seca, refrigerada, perigosa, fragil, outros, or custom text)';
COMMENT ON COLUMN submissions.categoria_rejeicao IS 'Rejection category (documentos-incompletos, documentos-invalidos, informacoes-incorretas, nao-atende-requisitos, outro)';
