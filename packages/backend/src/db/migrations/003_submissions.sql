-- =====================================================
-- MIGRACAO 003: TABELA DE SUBMISSIONS (FILA DE CADASTROS)
-- =====================================================

-- Enum para status de submission
CREATE TYPE submission_status AS ENUM ('pendente', 'em_analise', 'aprovado', 'rejeitado');

-- Enum para prioridade
CREATE TYPE submission_priority AS ENUM ('normal', 'alta', 'urgente');

-- Tabela de submissions (fila de cadastros de motoristas)
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Dados do motorista
    nome_motorista VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),

    -- Dados do veiculo
    placa VARCHAR(10),
    tipo_veiculo VARCHAR(100),

    -- Status e controle
    status submission_status NOT NULL DEFAULT 'pendente',
    prioridade submission_priority NOT NULL DEFAULT 'normal',

    -- Relacionamentos
    operador_id UUID REFERENCES users(id),
    analista_id UUID REFERENCES users(id),

    -- Timestamps de workflow
    data_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_inicio_analise TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,

    -- Observacoes
    observacoes TEXT,
    motivo_rejeicao TEXT,

    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para submissions
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_prioridade ON submissions(prioridade);
CREATE INDEX IF NOT EXISTS idx_submissions_operador ON submissions(operador_id);
CREATE INDEX IF NOT EXISTS idx_submissions_analista ON submissions(analista_id);
CREATE INDEX IF NOT EXISTS idx_submissions_cpf ON submissions(cpf);
CREATE INDEX IF NOT EXISTS idx_submissions_data_envio ON submissions(data_envio DESC);

-- Indice composto para fila
CREATE INDEX IF NOT EXISTS idx_submissions_fila
    ON submissions(status, prioridade DESC, data_envio ASC);

-- Trigger para updated_at
CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
