-- =====================================================
-- BBT CONNECT - SCRIPT DE INICIALIZACAO DO BANCO
-- Execute este script para criar o banco do zero
-- =====================================================

-- Extensao para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- Enum para roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'gestor', 'operacional', 'cadastro', 'comercial', 'auditor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para status de submission
DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('pendente', 'em_analise', 'aprovado', 'rejeitado', 'devolvido');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para prioridade
DO $$ BEGIN
    CREATE TYPE submission_priority AS ENUM ('normal', 'alta', 'urgente');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para tipos de documento
DO $$ BEGIN
    CREATE TYPE document_type AS ENUM (
        'crlv', 'antt', 'cnh', 'endereco', 'bancario', 'pamcard',
        'gr', 'rcv', 'contrato', 'flex', 'cte', 'outros'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para tickets
DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('aberto', 'em_andamento', 'resolvido', 'fechado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_categoria AS ENUM ('bug', 'duvida', 'sugestao', 'outro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- FUNCAO PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TABELA DE USUARIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    nome VARCHAR(255) NOT NULL,
    password VARCHAR(100) NOT NULL DEFAULT 'bbt123',
    role user_role NOT NULL DEFAULT 'operacional',
    ativo BOOLEAN DEFAULT TRUE,
    filial_id VARCHAR(50),
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_ativo ON users(ativo) WHERE ativo = TRUE;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA DE SUBMISSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Dados do motorista
    nome_motorista VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    tel_motorista VARCHAR(20),
    tel_proprietario VARCHAR(20),
    endereco_residencial TEXT,
    numero_pis VARCHAR(20),

    -- Dados do veiculo
    placa VARCHAR(10),
    tipo_veiculo VARCHAR(100),

    -- Dados da carga/operacao
    origem VARCHAR(255),
    destino VARCHAR(255),
    localizacao_atual VARCHAR(255),
    tipo_mercadoria VARCHAR(255),
    valor_mercadoria DECIMAL(12, 2),

    -- Referencias
    referencia_comercial_1 TEXT,
    referencia_comercial_2 TEXT,
    referencia_pessoal_1 TEXT,
    referencia_pessoal_2 TEXT,
    referencia_pessoal_3 TEXT,

    -- Tipo de cadastro
    tipo_cadastro VARCHAR(50) NOT NULL DEFAULT 'novo_cadastro'
        CHECK (tipo_cadastro IN ('novo_cadastro', 'atualizacao', 'agregado', 'bens_rodando')),
    requer_rastreamento BOOLEAN DEFAULT false,
    coordenadas_rastreamento JSONB,

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

    -- Devolucao
    devolvido_em TIMESTAMP WITH TIME ZONE,
    devolvido_por UUID REFERENCES users(id),

    -- Observacoes e rejeicao
    observacoes TEXT,
    motivo_rejeicao TEXT,
    categoria_rejeicao VARCHAR(100),

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
CREATE INDEX IF NOT EXISTS idx_submissions_tipo_cadastro ON submissions(tipo_cadastro);
CREATE INDEX IF NOT EXISTS idx_submissions_requer_rastreamento ON submissions(requer_rastreamento);
CREATE INDEX IF NOT EXISTS idx_submissions_devolvido_em ON submissions(devolvido_em);
CREATE INDEX IF NOT EXISTS idx_submissions_devolvido_por ON submissions(devolvido_por);
CREATE INDEX IF NOT EXISTS idx_submissions_operador_status ON submissions(operador_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_fila ON submissions(status, prioridade DESC, data_envio ASC);
CREATE INDEX IF NOT EXISTS idx_submissions_origem ON submissions(origem);
CREATE INDEX IF NOT EXISTS idx_submissions_destino ON submissions(destino);
CREATE INDEX IF NOT EXISTS idx_submissions_tipo_mercadoria ON submissions(tipo_mercadoria);

DROP TRIGGER IF EXISTS update_submissions_updated_at ON submissions;
CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA DE DOCUMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    tipo document_type NOT NULL,
    nome_original VARCHAR(255) NOT NULL,
    nome_armazenado VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    caminho TEXT NOT NULL,
    validado BOOLEAN DEFAULT FALSE,
    validado_por UUID REFERENCES users(id),
    validado_em TIMESTAMP WITH TIME ZONE,
    observacao_validacao TEXT,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_submission ON documents(submission_id);
CREATE INDEX IF NOT EXISTS idx_documents_tipo ON documents(tipo);
CREATE INDEX IF NOT EXISTS idx_documents_validado ON documents(validado);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA DE AUDIT LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    user_nome VARCHAR(255),
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(100) NOT NULL,
    entidade_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_acao ON audit_logs(acao);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entidade ON audit_logs(entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_dados_gin ON audit_logs USING GIN (dados_novos);

-- =====================================================
-- TABELA DE DELAYS
-- =====================================================

CREATE TABLE IF NOT EXISTS delays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL,
    criado_por UUID NOT NULL REFERENCES users(id),
    criado_em TIMESTAMP DEFAULT NOW(),
    notificado BOOLEAN DEFAULT FALSE,
    notificado_em TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delays_submission ON delays(submission_id);
CREATE INDEX IF NOT EXISTS idx_delays_criado_por ON delays(criado_por);
CREATE INDEX IF NOT EXISTS idx_delays_criado_em ON delays(criado_em DESC);

-- =====================================================
-- TABELA DE TICKETS
-- =====================================================

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

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_categoria ON tickets(categoria);
CREATE INDEX IF NOT EXISTS idx_tickets_usuario_id ON tickets(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA DE CHECKLISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    item_nome VARCHAR(255) NOT NULL,
    completado BOOLEAN DEFAULT false,
    completado_por UUID REFERENCES users(id),
    completado_em TIMESTAMP WITH TIME ZONE,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklists_submission ON checklists(submission_id);

-- =====================================================
-- TABELA DE CHECKLIST TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS checklist_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_cadastro VARCHAR(50) NOT NULL,
    item_nome VARCHAR(255) NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 0,
    obrigatorio BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tipo_cadastro, item_nome)
);

-- Inserir templates padrao
INSERT INTO checklist_templates (tipo_cadastro, item_nome, ordem, obrigatorio)
VALUES
    ('novo_cadastro', 'Verificar CPF/CNPJ', 1, true),
    ('novo_cadastro', 'Validar CRLV (3 docs)', 2, true),
    ('novo_cadastro', 'Validar ANTT', 3, true),
    ('novo_cadastro', 'Validar CNH do Proprietário', 4, true),
    ('novo_cadastro', 'Verificar Referências Comerciais', 5, true),
    ('novo_cadastro', 'Verificar Referências Pessoais', 6, true),
    ('novo_cadastro', 'Validar Dados Bancários', 7, false),
    ('atualizacao', 'Verificar CRLV atualizado', 1, true),
    ('atualizacao', 'Verificar documentos alterados', 2, false),
    ('agregado', 'Validar CNH', 1, true),
    ('agregado', 'Validar ANTT', 2, true),
    ('agregado', 'Verificar vínculo', 3, true),
    ('bens_rodando', 'Verificar dados do veículo', 1, false),
    ('bens_rodando', 'Verificar documentação básica', 2, false)
ON CONFLICT (tipo_cadastro, item_nome) DO NOTHING;

-- =====================================================
-- TABELA DE MIGRACOES (para controle)
-- =====================================================

CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT NOW()
);

-- Marcar todas as migracoes como executadas
INSERT INTO _migrations (name) VALUES
    ('001_users.sql'),
    ('002_better_auth.sql'),
    ('003_submissions.sql'),
    ('004_documents.sql'),
    ('005_audit_logs.sql'),
    ('005_make_driver_fields_optional.sql'),
    ('006_workflow_enhancements.sql'),
    ('007_remove_better_auth.sql'),
    ('008_simple_password_auth.sql'),
    ('009_add_auditor_role.sql'),
    ('010_tickets.sql'),
    ('011_tipos_cadastro.sql'),
    ('012_devolvido_fields.sql')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- USUARIOS PRE-CADASTRADOS
-- =====================================================

INSERT INTO users (email, nome, password, role, filial_id, ativo) VALUES
-- Administradores
('ti.mtz@bbttransportes.com.br', 'Luciano Alves', 'bbt@2026', 'admin', 'Tecnologia', true),
('marcius.fleury@bbttransportes.com.br', 'Marcius Fleury', 'bbt@2026', 'admin', 'Gestor Comercial Lotacao', true),

-- Cadastro (GR)
('gr.mtz01@bbttransportes.com.br', 'Jordana Alves', 'bbt@2026', 'cadastro', 'GR', true),
('gr.mtz02@bbttransportes.com.br', 'Jullia de Oliveira', 'bbt@2026', 'cadastro', 'GR', true),
('gr.mtz03@bbttransportes.com.br', 'Geovanna', 'bbt@2026', 'cadastro', 'GR', true),

-- Operadores
('agregados.mtz@bbttransportes.com.br', 'Sidney Ferreira', 'bbt@2026', 'operacional', 'Agregados', true),
('agenciadora@bbttransportes.com.br', 'Agenciadora', 'bbt@2026', 'operacional', 'Agenciadora', true),
('comercial01.sao@bbttransportes.com.br', 'Mariana Figueiredo', 'bbt@2026', 'operacional', 'Bens Rodando', true),
('comercial02.sao@bbttransportes.com.br', 'Maycon Douglas', 'bbt@2026', 'operacional', 'Bens Rodando', true),
('operacional.sao@bbttransportes.com.br', 'Evandro William Avigo', 'bbt@2026', 'operacional', 'Bens Rodando', true),
('operacional.mtz@bbttransportes.com.br', 'Edcarlos Antonio', 'bbt@2026', 'operacional', 'Comercial Lotacao', true),
('operacional01.gyn@bbttransportes.com.br', 'Igor Costa', 'bbt@2026', 'operacional', 'Comercial Lotacao', true),
('operacional01.mtz@bbttransportes.com.br', 'Tainallys Ferreira', 'bbt@2026', 'operacional', 'Operacao', true),
('operacional02.gyn@bbttransportes.com.br', 'Danubia de Sousa', 'bbt@2026', 'operacional', 'Operacao', true),
('operacional04.mtz@bbttransportes.com.br', 'Maria Paula', 'bbt@2026', 'operacional', 'Comercial Lotacao', true),
('operacional05.mtz@bbttransportes.com.br', 'Mariane Sa', 'bbt@2026', 'operacional', 'Comercial Lotacao', true),
('operacional09.mtz@bbttransportes.com.br', 'Miqueias Macedo', 'bbt@2026', 'operacional', 'Operacao', true),
('comercial03.gyn@bbttransportes.com.br', 'Bruno Ribeiro', 'bbt@2026', 'operacional', 'Comercial Lotacao', true),
('gestor.mtz@b4comex.com.br', 'Julia Cavalcante', 'bbt@2026', 'operacional', 'B4 Comex', true),
('operacional.comex@bbttransportes.com.br', 'Operacao COMEX', 'bbt@2026', 'operacional', 'B4 Comex', true),
('comercial.comex@bbttransportes.com.br', 'Comercial COMEX', 'bbt@2026', 'operacional', 'B4 Comex', true),
('coletas.gyn@bbttransportes.com.br', 'Victor Saraiva', 'bbt@2026', 'operacional', 'Operacao Fracionado', true),
('operacional.gyn@bbttransportes.com.br', 'Roberta Alves', 'bbt@2026', 'operacional', 'Operacao Fracionado', true)

ON CONFLICT (email) DO UPDATE SET
    nome = EXCLUDED.nome,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    filial_id = EXCLUDED.filial_id,
    ativo = EXCLUDED.ativo;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
