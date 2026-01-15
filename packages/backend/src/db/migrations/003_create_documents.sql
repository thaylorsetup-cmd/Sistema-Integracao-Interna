-- ============================================================
-- MIGRAÇÃO 003: Tabela de Documentos
-- BBT Connect Backend
-- ============================================================
-- Tipo enum para tipos de documento
CREATE TYPE document_type AS ENUM (
    'crlv',
    'antt',
    'cnh',
    'endereco',
    'bancario',
    'pamcard',
    'gr',
    'rcv',
    'doc_prop',
    'end_prop',
    'outros'
);
-- Tabela de documentos
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    type document_type NOT NULL,
    custom_description VARCHAR(255),
    filename VARCHAR(500) NOT NULL,
    filepath VARCHAR(1000) NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX idx_documents_submission ON documents(submission_id);
CREATE INDEX idx_documents_type ON documents(type);