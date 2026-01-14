-- =============================================
-- GUARDIÃO V2 - DATABASE SCHEMA
-- PostgreSQL 15+
-- Inicialização automática via Docker
-- =============================================

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para buscas fuzzy

-- =============================================
-- 1. TABELA: usuarios
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    senha_hash VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('OPERADOR', 'GESTOR', 'DIRETOR', 'ADMIN')),
    avatar_url VARCHAR(500),
    ativo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);

-- =============================================
-- 2. TABELA: fila_cadastro (Sistema de Comunicação Operação ↔ Cadastro)
-- =============================================
CREATE TABLE IF NOT EXISTS fila_cadastro (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('MOTORISTA', 'DOCUMENTO', 'VEICULO', 'CLIENTE', 'FORNECEDOR')),
    entidade_id VARCHAR(50) NOT NULL,
    entidade_nome VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDENTE', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'BLOQUEADO')),
    prioridade VARCHAR(10) DEFAULT 'NORMAL' CHECK (prioridade IN ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE', 'CRITICA')),

    -- Campos de comunicação
    descricao TEXT,
    documentos_anexos JSONB DEFAULT '[]'::jsonb, -- URLs dos documentos
    comentarios JSONB DEFAULT '[]'::jsonb, -- Array de comentários { usuario, timestamp, texto }

    -- Workflow
    atribuido_a INT REFERENCES usuarios(id),
    solicitado_por INT REFERENCES usuarios(id),
    departamento_origem VARCHAR(50), -- 'OPERACAO', 'CADASTRO', 'GR', 'FINANCEIRO'
    departamento_destino VARCHAR(50),

    -- Timestamps
    iniciado_em TIMESTAMP,
    finalizado_em TIMESTAMP,
    prazo_limite TIMESTAMP,

    -- Feedback
    motivo_rejeicao TEXT,
    observacoes TEXT,

    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Tempo calculado automaticamente
    tempo_espera_minutos INT GENERATED ALWAYS AS (
        CASE
            WHEN finalizado_em IS NOT NULL THEN
                EXTRACT(EPOCH FROM (finalizado_em - created_at)) / 60
            ELSE
                EXTRACT(EPOCH FROM (NOW() - created_at)) / 60
        END
    ) STORED
);

CREATE INDEX idx_fila_status ON fila_cadastro(status);
CREATE INDEX idx_fila_tipo ON fila_cadastro(tipo);
CREATE INDEX idx_fila_prioridade ON fila_cadastro(prioridade);
CREATE INDEX idx_fila_atribuido ON fila_cadastro(atribuido_a);
CREATE INDEX idx_fila_tempo ON fila_cadastro(tempo_espera_minutos);
CREATE INDEX idx_fila_departamento ON fila_cadastro(departamento_origem, departamento_destino);

-- =============================================
-- 3. TABELA: alertas
-- =============================================
CREATE TABLE IF NOT EXISTS alertas (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('CRITICO', 'ALTO', 'MEDIO', 'BAIXO', 'INFORMATIVO')),
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,

    -- Entidade relacionada
    entidade_tipo VARCHAR(50),
    entidade_id VARCHAR(50),

    -- Status e workflow
    status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'LIDO', 'RESPONDIDO', 'ESCALADO', 'EXPIRADO', 'RESOLVIDO')),

    -- Destinatários
    destinatario_id INT REFERENCES usuarios(id),
    resposta TEXT,
    respondido_por INT REFERENCES usuarios(id),
    respondido_em TIMESTAMP,

    -- Escalação
    escalado_para INT REFERENCES usuarios(id),
    escalado_em TIMESTAMP,
    motivo_escalacao TEXT,

    -- Integração WhatsApp
    whatsapp_message_id VARCHAR(100),
    whatsapp_enviado BOOLEAN DEFAULT FALSE,
    whatsapp_lido BOOLEAN DEFAULT FALSE,

    -- Expiração
    expires_at TIMESTAMP,

    -- Ações rápidas (botões WhatsApp)
    acoes_disponiveis JSONB DEFAULT '[]'::jsonb,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alertas_status ON alertas(status);
CREATE INDEX idx_alertas_tipo ON alertas(tipo);
CREATE INDEX idx_alertas_destinatario ON alertas(destinatario_id);
CREATE INDEX idx_alertas_expires ON alertas(expires_at);

-- =============================================
-- 4. TABELA: coletas (Sync do ERP)
-- =============================================
CREATE TABLE IF NOT EXISTS coletas (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    erp_id VARCHAR(50) UNIQUE NOT NULL,

    -- Dados da coleta
    numero_coleta VARCHAR(50),
    cliente_codigo VARCHAR(50),
    cliente_nome VARCHAR(200),
    cliente_cnpj VARCHAR(18),

    -- Origem e Destino
    origem_cidade VARCHAR(100),
    origem_uf VARCHAR(2),
    origem_cep VARCHAR(10),
    destino_cidade VARCHAR(100),
    destino_uf VARCHAR(2),
    destino_cep VARCHAR(10),

    -- Status e valores
    status VARCHAR(30) NOT NULL CHECK (status IN ('DISPONIVEL', 'CADASTRADA', 'CONTRATACAO', 'COLETADA', 'EM_TRANSITO', 'COMANDADA', 'ENTREGUE', 'CANCELADA')),
    valor_frete DECIMAL(10,2),
    peso_kg DECIMAL(10,2),
    volume_m3 DECIMAL(10,2),

    -- Datas
    data_coleta DATE,
    data_entrega_prevista DATE,
    data_entrega_realizada DATE,

    -- Motorista e veículo
    motorista_codigo VARCHAR(50),
    motorista_nome VARCHAR(100),
    motorista_cpf VARCHAR(14),
    veiculo_placa VARCHAR(10),
    veiculo_tipo VARCHAR(50),

    -- Observações
    observacoes TEXT,

    -- Sync
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coletas_status ON coletas(status);
CREATE INDEX idx_coletas_erp_id ON coletas(erp_id);
CREATE INDEX idx_coletas_synced ON coletas(synced_at);
CREATE INDEX idx_coletas_cliente ON coletas(cliente_codigo);
CREATE INDEX idx_coletas_motorista ON coletas(motorista_codigo);
CREATE INDEX idx_coletas_data_coleta ON coletas(data_coleta);

-- =============================================
-- 5. TABELA: documentos (Anexos do sistema)
-- =============================================
CREATE TABLE IF NOT EXISTS documentos (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,

    -- Metadados
    nome_original VARCHAR(255) NOT NULL,
    nome_armazenado VARCHAR(255) NOT NULL,
    tipo_mime VARCHAR(100),
    tamanho_bytes BIGINT,

    -- Categorização
    categoria VARCHAR(50) CHECK (categoria IN ('CNH', 'CRLV', 'CONTRATO', 'NOTA_FISCAL', 'CTE', 'FOTO', 'OUTROS')),

    -- Relacionamento
    entidade_tipo VARCHAR(50), -- 'FILA', 'ALERTA', 'MOTORISTA', etc
    entidade_id INT,

    -- Armazenamento
    storage_path VARCHAR(500),
    storage_url VARCHAR(500),

    -- Upload
    enviado_por INT REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documentos_entidade ON documentos(entidade_tipo, entidade_id);
CREATE INDEX idx_documentos_categoria ON documentos(categoria);

-- =============================================
-- 6. TABELA: audit_logs (Auditoria completa)
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,

    -- Quando e quem
    timestamp TIMESTAMP DEFAULT NOW(),
    usuario_id INT REFERENCES usuarios(id),
    usuario_nome VARCHAR(100),
    usuario_tipo VARCHAR(20),

    -- O que foi feito
    acao VARCHAR(100) NOT NULL,
    modulo VARCHAR(50) NOT NULL,

    -- Onde foi feito
    entidade_tipo VARCHAR(50),
    entidade_id VARCHAR(50),

    -- Dados
    dados_antes JSONB,
    dados_depois JSONB,
    diferencas JSONB, -- Campos que mudaram

    -- Contexto técnico
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_id VARCHAR(100),

    -- Metadata adicional
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Índices de performance
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_usuario ON audit_logs(usuario_id);
CREATE INDEX idx_audit_modulo ON audit_logs(modulo);
CREATE INDEX idx_audit_acao ON audit_logs(acao);
CREATE INDEX idx_audit_entidade ON audit_logs(entidade_tipo, entidade_id);

-- =============================================
-- 7. TABELA: notificacoes (Sistema de notificações tempo real)
-- =============================================
CREATE TABLE IF NOT EXISTS notificacoes (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,

    -- Destinatário
    usuario_id INT REFERENCES usuarios(id) NOT NULL,

    -- Conteúdo
    tipo VARCHAR(50) NOT NULL, -- 'FILA_NOVA', 'FILA_ATRASADA', 'ALERTA', 'DOCUMENTO_ENVIADO', etc
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT,

    -- Link de ação
    link_acao VARCHAR(500),

    -- Relacionamento
    entidade_tipo VARCHAR(50),
    entidade_id INT,

    -- Status
    lida BOOLEAN DEFAULT FALSE,
    lida_em TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notif_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notif_lida ON notificacoes(lida);
CREATE INDEX idx_notif_created ON notificacoes(created_at DESC);

-- =============================================
-- 8. VIEWS ÚTEIS
-- =============================================

-- View: Itens críticos na fila (> 30 min ou prioridade URGENTE/CRITICA)
CREATE OR REPLACE VIEW v_fila_criticos AS
SELECT
    id,
    uuid,
    tipo,
    entidade_nome,
    status,
    prioridade,
    tempo_espera_minutos,
    atribuido_a,
    departamento_origem,
    departamento_destino,
    created_at,
    CASE
        WHEN tempo_espera_minutos > 60 THEN 'VERMELHO'
        WHEN tempo_espera_minutos > 30 THEN 'LARANJA'
        WHEN tempo_espera_minutos > 15 THEN 'AMARELO'
        ELSE 'VERDE'
    END as cor_indicador
FROM fila_cadastro
WHERE status IN ('PENDENTE', 'EM_ANALISE')
  AND (tempo_espera_minutos > 30 OR prioridade IN ('URGENTE', 'CRITICA'))
ORDER BY prioridade DESC, tempo_espera_minutos DESC;

-- View: Resumo de coletas por status
CREATE OR REPLACE VIEW v_coletas_resumo AS
SELECT
    status,
    COUNT(*) as quantidade,
    SUM(valor_frete) as valor_total,
    SUM(peso_kg) as peso_total,
    SUM(volume_m3) as volume_total
FROM coletas
GROUP BY status;

-- View: Performance dos operadores (últimas 24h)
CREATE OR REPLACE VIEW v_performance_operadores AS
SELECT
    u.id,
    u.nome,
    u.tipo,
    COUNT(CASE WHEN f.status = 'APROVADO' THEN 1 END) as total_aprovados,
    COUNT(CASE WHEN f.status = 'REJEITADO' THEN 1 END) as total_rejeitados,
    COUNT(CASE WHEN f.status IN ('APROVADO', 'REJEITADO') THEN 1 END) as total_processados,
    ROUND(AVG(CASE
        WHEN f.status IN ('APROVADO', 'REJEITADO') AND f.finalizado_em IS NOT NULL
        THEN EXTRACT(EPOCH FROM (f.finalizado_em - f.iniciado_em)) / 60
    END), 2) as tempo_medio_minutos
FROM usuarios u
LEFT JOIN fila_cadastro f ON f.atribuido_a = u.id
    AND f.updated_at >= NOW() - INTERVAL '24 hours'
WHERE u.tipo IN ('OPERADOR', 'GESTOR')
GROUP BY u.id, u.nome, u.tipo
ORDER BY total_processados DESC;

-- View: Alertas pendentes por usuário
CREATE OR REPLACE VIEW v_alertas_pendentes AS
SELECT
    u.id as usuario_id,
    u.nome as usuario_nome,
    COUNT(a.id) as total_pendentes,
    COUNT(CASE WHEN a.tipo = 'CRITICO' THEN 1 END) as criticos,
    COUNT(CASE WHEN a.tipo = 'ALTO' THEN 1 END) as altos,
    MIN(a.created_at) as mais_antigo
FROM usuarios u
LEFT JOIN alertas a ON a.destinatario_id = u.id
    AND a.status = 'PENDENTE'
GROUP BY u.id, u.nome
HAVING COUNT(a.id) > 0
ORDER BY criticos DESC, total_pendentes DESC;

-- =============================================
-- 9. TRIGGERS (Auditoria automática)
-- =============================================

-- Function: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para todas as tabelas principais
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fila_updated_at BEFORE UPDATE ON fila_cadastro
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alertas_updated_at BEFORE UPDATE ON alertas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coletas_updated_at BEFORE UPDATE ON coletas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 10. DADOS INICIAIS (SEEDS)
-- =============================================

-- Usuários padrão (senha: guardiao2024)
INSERT INTO usuarios (nome, email, telefone, senha_hash, tipo) VALUES
('Jordana', 'jordana@bbttransportes.com.br', NULL, '$2b$10$LZ8EXR7qYqK5gzJ3YqHjOOxJqO0KzN0yqZ4qO0KzN0yqZ4qO0KzN0', 'OPERADOR'),
('Gilclésio', 'gilclesio@bbttransportes.com.br', NULL, '$2b$10$LZ8EXR7qYqK5gzJ3YqHjOOxJqO0KzN0yqZ4qO0KzN0yqZ4qO0KzN0', 'GESTOR'),
('Wilton', 'wilton@bbttransportes.com.br', '5564984342283', '$2b$10$LZ8EXR7qYqK5gzJ3YqHjOOxJqO0KzN0yqZ4qO0KzN0yqZ4qO0KzN0', 'DIRETOR'),
('Thaylor', 'thaylor@bbttransportes.com.br', '5562999892013', '$2b$10$LZ8EXR7qYqK5gzJ3YqHjOOxJqO0KzN0yqZ4qO0KzN0yqZ4qO0KzN0', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Dados mockados para desenvolvimento
INSERT INTO fila_cadastro (tipo, entidade_id, entidade_nome, status, prioridade, descricao, departamento_origem, departamento_destino, solicitado_por, created_at) VALUES
('MOTORISTA', 'MOT001', 'João Silva Santos', 'PENDENTE', 'ALTA', 'Novo motorista - validar documentação', 'OPERACAO', 'CADASTRO', 3, NOW() - INTERVAL '45 minutes'),
('MOTORISTA', 'MOT002', 'Maria Oliveira Costa', 'PENDENTE', 'NORMAL', 'Atualização de CNH vencida', 'OPERACAO', 'CADASTRO', 3, NOW() - INTERVAL '25 minutes'),
('DOCUMENTO', 'DOC123', 'CNH - José Pereira', 'EM_ANALISE', 'URGENTE', 'Documento com data de nascimento divergente', 'CADASTRO', 'GR', 1, NOW() - INTERVAL '15 minutes'),
('VEICULO', 'VEI789', 'Caminhão ABC-1234', 'PENDENTE', 'NORMAL', 'Renovação de CRLV', 'OPERACAO', 'CADASTRO', 3, NOW() - INTERVAL '10 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO alertas (tipo, titulo, mensagem, entidade_tipo, entidade_id, status, destinatario_id, expires_at) VALUES
('CRITICO', 'Possível duplicidade de motorista', 'Motorista "João Silva Santos" já existe no sistema com CPF similar: 123.456.789-00', 'MOTORISTA', 'MOT001', 'PENDENTE', 1, NOW() + INTERVAL '15 minutes'),
('ALTO', 'Documento vencido detectado', 'CNH do motorista Maria Oliveira Costa vence em 3 dias (28/12/2024)', 'MOTORISTA', 'MOT002', 'PENDENTE', 1, NOW() + INTERVAL '30 minutes'),
('MEDIO', 'Coleta sem motorista designado', 'Coleta COL-2024-001 está disponível há 2 horas sem motorista', 'COLETA', 'ERP12345', 'PENDENTE', 2, NOW() + INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

INSERT INTO coletas (erp_id, numero_coleta, cliente_nome, cliente_cnpj, origem_cidade, origem_uf, destino_cidade, destino_uf, status, valor_frete, peso_kg, data_coleta) VALUES
('ERP12345', 'COL-2024-001', 'Distribuidora ABC Ltda', '12.345.678/0001-90', 'São Paulo', 'SP', 'Rio de Janeiro', 'RJ', 'DISPONIVEL', 3500.00, 1200.00, CURRENT_DATE),
('ERP12346', 'COL-2024-002', 'Transportes XYZ S.A.', '98.765.432/0001-10', 'Curitiba', 'PR', 'Florianópolis', 'SC', 'CADASTRADA', 2200.00, 800.00, CURRENT_DATE),
('ERP12347', 'COL-2024-003', 'Logística Rápida', '11.222.333/0001-44', 'Brasília', 'DF', 'Goiânia', 'GO', 'COLETADA', 1800.00, 600.00, CURRENT_DATE - INTERVAL '1 day'),
('ERP12348', 'COL-2024-004', 'Cargas Pesadas Ltda', '55.666.777/0001-88', 'Belo Horizonte', 'MG', 'Vitória', 'ES', 'EM_TRANSITO', 2900.00, 1500.00, CURRENT_DATE - INTERVAL '2 days')
ON CONFLICT (erp_id) DO NOTHING;

-- =============================================
-- FIM DA INICIALIZAÇÃO
-- =============================================

-- Informações úteis
SELECT 'Database guardiao_ai initialized successfully!' as status;
SELECT 'Total tables created: ' || COUNT(*) as info FROM information_schema.tables WHERE table_schema = 'public';
