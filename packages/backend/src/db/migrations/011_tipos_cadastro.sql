-- =====================================================
-- MIGRACAO 011: TIPOS DE CADASTRO E NOVOS CAMPOS
-- Sistema de abas para envio de documentos
-- =====================================================
-- Adicionar tipo de cadastro à tabela submissions
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'tipo_cadastro'
) THEN
ALTER TABLE submissions
ADD COLUMN tipo_cadastro VARCHAR(50) NOT NULL DEFAULT 'novo_cadastro' CHECK (
        tipo_cadastro IN (
            'novo_cadastro',
            'atualizacao',
            'agregado',
            'bens_rodando'
        )
    );
END IF;
END $$;
-- Adicionar flag de rastreamento
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'requer_rastreamento'
) THEN
ALTER TABLE submissions
ADD COLUMN requer_rastreamento BOOLEAN DEFAULT false;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'coordenadas_rastreamento'
) THEN
ALTER TABLE submissions
ADD COLUMN coordenadas_rastreamento JSONB;
END IF;
END $$;
-- Novos campos obrigatórios para Cadastro Novo
DO $$ BEGIN -- Telefone do Proprietário
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'tel_proprietario'
) THEN
ALTER TABLE submissions
ADD COLUMN tel_proprietario VARCHAR(20);
END IF;
-- Endereço Residencial
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'endereco_residencial'
) THEN
ALTER TABLE submissions
ADD COLUMN endereco_residencial TEXT;
END IF;
-- Número PIS
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'numero_pis'
) THEN
ALTER TABLE submissions
ADD COLUMN numero_pis VARCHAR(20);
END IF;
-- Origem
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'origem'
) THEN
ALTER TABLE submissions
ADD COLUMN origem VARCHAR(255);
END IF;
-- Destino
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'destino'
) THEN
ALTER TABLE submissions
ADD COLUMN destino VARCHAR(255);
END IF;
-- Valor da Mercadoria
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'valor_mercadoria'
) THEN
ALTER TABLE submissions
ADD COLUMN valor_mercadoria DECIMAL(12, 2);
END IF;
-- Tipo de Mercadoria
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'tipo_mercadoria'
) THEN
ALTER TABLE submissions
ADD COLUMN tipo_mercadoria VARCHAR(255);
END IF;
-- Telefone do Motorista
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'tel_motorista'
) THEN
ALTER TABLE submissions
ADD COLUMN tel_motorista VARCHAR(20);
END IF;
-- Referências Comerciais
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'referencia_comercial_1'
) THEN
ALTER TABLE submissions
ADD COLUMN referencia_comercial_1 TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'referencia_comercial_2'
) THEN
ALTER TABLE submissions
ADD COLUMN referencia_comercial_2 TEXT;
END IF;
-- Referências Pessoais
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'referencia_pessoal_1'
) THEN
ALTER TABLE submissions
ADD COLUMN referencia_pessoal_1 TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'referencia_pessoal_2'
) THEN
ALTER TABLE submissions
ADD COLUMN referencia_pessoal_2 TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'referencia_pessoal_3'
) THEN
ALTER TABLE submissions
ADD COLUMN referencia_pessoal_3 TEXT;
END IF;
-- Categoria de rejeição
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
        AND column_name = 'categoria_rejeicao'
) THEN
ALTER TABLE submissions
ADD COLUMN categoria_rejeicao VARCHAR(50);
END IF;
END $$;
-- Atualizar enum de status para incluir 'devolvido'
DO $$ BEGIN -- Verificar se o valor 'devolvido' já existe no enum
IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'devolvido'
        AND enumtypid = (
            SELECT oid
            FROM pg_type
            WHERE typname = 'submission_status'
        )
) THEN ALTER TYPE submission_status
ADD VALUE IF NOT EXISTS 'devolvido';
END IF;
END $$;
-- Tabela para Checklist
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
-- Índice para checklists
CREATE INDEX IF NOT EXISTS idx_checklists_submission ON checklists(submission_id);
-- Índices para performance nos novos campos
CREATE INDEX IF NOT EXISTS idx_submissions_tipo_cadastro ON submissions(tipo_cadastro);
CREATE INDEX IF NOT EXISTS idx_submissions_requer_rastreamento ON submissions(requer_rastreamento);
-- Tabela para itens padrão de checklist por tipo de cadastro
CREATE TABLE IF NOT EXISTS checklist_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_cadastro VARCHAR(50) NOT NULL,
    item_nome VARCHAR(255) NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 0,
    obrigatorio BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tipo_cadastro, item_nome)
);
-- Inserir itens de checklist padrão
INSERT INTO checklist_templates (tipo_cadastro, item_nome, ordem, obrigatorio)
VALUES -- Novo Cadastro
    ('novo_cadastro', 'Verificar CPF/CNPJ', 1, true),
    (
        'novo_cadastro',
        'Validar CRLV (3 docs)',
        2,
        true
    ),
    ('novo_cadastro', 'Validar ANTT', 3, true),
    (
        'novo_cadastro',
        'Validar CNH do Proprietário',
        4,
        true
    ),
    (
        'novo_cadastro',
        'Verificar Referências Comerciais',
        5,
        true
    ),
    (
        'novo_cadastro',
        'Verificar Referências Pessoais',
        6,
        true
    ),
    (
        'novo_cadastro',
        'Validar Dados Bancários',
        7,
        false
    ),
    -- Atualização
    (
        'atualizacao',
        'Verificar CRLV atualizado',
        1,
        true
    ),
    (
        'atualizacao',
        'Verificar documentos alterados',
        2,
        false
    ),
    -- Agregado
    ('agregado', 'Validar CNH', 1, true),
    ('agregado', 'Validar ANTT', 2, true),
    ('agregado', 'Verificar vínculo', 3, true),
    -- Bens Rodando
    (
        'bens_rodando',
        'Verificar dados do veículo',
        1,
        false
    ),
    (
        'bens_rodando',
        'Verificar documentação básica',
        2,
        false
    ) ON CONFLICT (tipo_cadastro, item_nome) DO NOTHING;
-- Comentário explicativo
COMMENT ON TABLE checklists IS 'Checklist de validação para cada submission';
COMMENT ON TABLE checklist_templates IS 'Templates de checklist por tipo de cadastro';
COMMENT ON COLUMN submissions.tipo_cadastro IS 'Tipo: novo_cadastro, atualizacao, agregado, bens_rodando';
COMMENT ON COLUMN submissions.requer_rastreamento IS 'Se a carga requer rastreamento (baseado em valor/tipo)';