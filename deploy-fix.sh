#!/bin/bash
# ==============================================
# BBT Connect - Script de Deploy e Correção
# Execute no servidor de produção
# ==============================================

set -e

echo "=============================================="
echo "🚀 BBT Connect - Deploy e Correção"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se estamos no diretório correto
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Erro: docker-compose.prod.yml não encontrado${NC}"
    echo "Execute este script no diretório raiz do projeto"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Passo 1: Verificando estado atual...${NC}"
docker service ls | grep bbt || echo "Nenhum serviço bbt encontrado"

# 2. Verificar e corrigir DATABASE_URL no compose
echo ""
echo -e "${YELLOW}📋 Passo 2: Verificando DATABASE_URL...${NC}"
if grep -q "@bbt_connect_postgres:5432" docker-compose.prod.yml; then
    echo "Corrigindo DATABASE_URL..."
    sed -i 's/@bbt_connect_postgres:5432/@postgres:5432/g' docker-compose.prod.yml
    echo -e "${GREEN}✅ DATABASE_URL corrigido${NC}"
else
    echo -e "${GREEN}✅ DATABASE_URL já está correto${NC}"
fi

# 3. Verificar Dockerfile do backend
echo ""
echo -e "${YELLOW}📋 Passo 3: Verificando Dockerfile do backend...${NC}"
if grep -q "COPY.*src/db/migrations.*dist/db/migrations" packages/backend/Dockerfile; then
    echo -e "${GREEN}✅ Dockerfile já tem cópia de migrations${NC}"
else
    echo "Adicionando cópia de migrations no Dockerfile..."
    sed -i '/COPY --from=builder \/app\/packages\/backend\/dist \.\/packages\/backend\/dist/a\
\
# Copiar arquivos SQL de migrations (nao sao compilados pelo TypeScript)\
COPY --from=builder /app/packages/backend/src/db/migrations ./packages/backend/dist/db/migrations' packages/backend/Dockerfile
    echo -e "${GREEN}✅ Dockerfile corrigido${NC}"
fi

# 4. Aplicar migrations no banco (se necessário)
echo ""
echo -e "${YELLOW}📋 Passo 4: Aplicando migrations no PostgreSQL...${NC}"

POSTGRES_CONTAINER=$(docker ps -qf "name=postgres" | head -1)
if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}❌ Container PostgreSQL não encontrado${NC}"
else
    echo "Container PostgreSQL encontrado: $POSTGRES_CONTAINER"

    # Verificar se tabela tickets existe
    TICKETS_EXISTS=$(docker exec $POSTGRES_CONTAINER psql -U bbt_user -d bbt_connect -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tickets');" 2>/dev/null || echo "f")

    if [ "$TICKETS_EXISTS" = "t" ]; then
        echo -e "${GREEN}✅ Tabela tickets já existe${NC}"
    else
        echo "Criando tabela tickets..."
        docker exec $POSTGRES_CONTAINER psql -U bbt_user -d bbt_connect -c "
-- Migration 010: Tickets
DO \$\$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        CREATE TYPE ticket_status AS ENUM ('aberto', 'em_andamento', 'resolvido', 'fechado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_categoria') THEN
        CREATE TYPE ticket_categoria AS ENUM ('bug', 'duvida', 'sugestao', 'outro');
    END IF;
END \$\$;

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

INSERT INTO _migrations (name) VALUES ('010_tickets.sql') ON CONFLICT DO NOTHING;
"
        echo -e "${GREEN}✅ Tabela tickets criada${NC}"
    fi

    # Verificar coluna tipo_cadastro
    TIPO_CADASTRO_EXISTS=$(docker exec $POSTGRES_CONTAINER psql -U bbt_user -d bbt_connect -tAc "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'tipo_cadastro');" 2>/dev/null || echo "f")

    if [ "$TIPO_CADASTRO_EXISTS" = "t" ]; then
        echo -e "${GREEN}✅ Coluna tipo_cadastro já existe${NC}"
    else
        echo "Aplicando migrations 011-013..."
        docker exec $POSTGRES_CONTAINER psql -U bbt_user -d bbt_connect -c "
-- Migration 011: Tipos de cadastro
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS tipo_cadastro VARCHAR(50) DEFAULT 'novo_cadastro';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS requer_rastreamento BOOLEAN DEFAULT false;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS coordenadas_rastreamento JSONB;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS tel_proprietario VARCHAR(20);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS endereco_residencial TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS numero_pis VARCHAR(20);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS origem VARCHAR(255);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS destino VARCHAR(255);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS valor_mercadoria DECIMAL(12, 2);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS tipo_mercadoria VARCHAR(255);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS tel_motorista VARCHAR(20);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS referencia_comercial_1 TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS referencia_comercial_2 TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS referencia_pessoal_1 TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS referencia_pessoal_2 TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS referencia_pessoal_3 TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS categoria_rejeicao VARCHAR(50);

-- Migration 012: Campos devolução
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS devolvido_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS devolvido_por UUID REFERENCES users(id);

-- Migration 013: Campos opcionais
ALTER TABLE submissions ALTER COLUMN nome_motorista DROP NOT NULL;
ALTER TABLE submissions ALTER COLUMN cpf DROP NOT NULL;

-- Registrar
INSERT INTO _migrations (name) VALUES ('011_tipos_cadastro.sql') ON CONFLICT DO NOTHING;
INSERT INTO _migrations (name) VALUES ('012_devolvido_fields.sql') ON CONFLICT DO NOTHING;
INSERT INTO _migrations (name) VALUES ('013_make_driver_fields_optional.sql') ON CONFLICT DO NOTHING;
"
        echo -e "${GREEN}✅ Migrations 011-013 aplicadas${NC}"
    fi
fi

# 5. Rebuild das imagens
echo ""
echo -e "${YELLOW}📋 Passo 5: Rebuild das imagens Docker...${NC}"

echo "Building backend..."
docker build -f packages/backend/Dockerfile -t bbtconnect-backend:latest . 2>&1 | tail -5

echo "Building frontend..."
docker build -f packages/frontend/Dockerfile \
    --build-arg VITE_API_URL=https://control.bbttransportes.com.br/api \
    --build-arg VITE_WS_URL=https://control.bbttransportes.com.br \
    -t bbtconnect-frontend:latest . 2>&1 | tail -5

echo -e "${GREEN}✅ Imagens construídas${NC}"

# 6. Deploy do stack
echo ""
echo -e "${YELLOW}📋 Passo 6: Deploy do stack...${NC}"

# Verificar se network_public existe
if ! docker network ls | grep -q "network_public"; then
    echo "Criando network_public..."
    docker network create --driver overlay --attachable network_public
fi

docker stack deploy -c docker-compose.prod.yml bbt_connect

echo ""
echo -e "${GREEN}✅ Stack deployado${NC}"

# 7. Aguardar serviços ficarem saudáveis
echo ""
echo -e "${YELLOW}📋 Passo 7: Aguardando serviços...${NC}"
sleep 15

docker service ls | grep bbt

# 8. Testar endpoints
echo ""
echo -e "${YELLOW}📋 Passo 8: Testando endpoints...${NC}"

sleep 5

# Health check
echo "Testando /health..."
curl -s http://localhost:3001/health 2>/dev/null | head -1 || echo "Backend ainda iniciando..."

echo ""
echo "=============================================="
echo -e "${GREEN}🎉 Deploy concluído!${NC}"
echo "=============================================="
echo ""
echo "Próximos passos:"
echo "1. Verifique os logs: docker service logs bbt_connect_backend --tail 50"
echo "2. Teste no navegador: https://control.bbttransportes.com.br"
echo "3. Verifique DevTools > Network para erros"
echo ""
