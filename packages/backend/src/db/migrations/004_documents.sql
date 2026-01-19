-- =====================================================
-- MIGRACAO 004: TABELA DE DOCUMENTOS
-- =====================================================

-- Enum para tipos de documento
CREATE TYPE document_type AS ENUM (
    'crlv',
    'antt',
    'cnh',
    'endereco',
    'bancario',
    'pamcard',
    'gr',
    'rcv',
    'contrato',
    'outros'
);

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relacionamento com submission
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,

    -- Informacoes do arquivo
    tipo document_type NOT NULL,
    nome_original VARCHAR(255) NOT NULL,
    nome_armazenado VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    caminho TEXT NOT NULL,

    -- Validacao
    validado BOOLEAN DEFAULT FALSE,
    validado_por UUID REFERENCES users(id),
    validado_em TIMESTAMP WITH TIME ZONE,
    observacao_validacao TEXT,

    -- Upload
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para documents
CREATE INDEX IF NOT EXISTS idx_documents_submission ON documents(submission_id);
CREATE INDEX IF NOT EXISTS idx_documents_tipo ON documents(tipo);
CREATE INDEX IF NOT EXISTS idx_documents_validado ON documents(validado);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Trigger para updated_at
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
