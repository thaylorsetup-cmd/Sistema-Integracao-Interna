#!/bin/bash
# =====================================================
# BBT CONNECT - PRIMEIRA INSTALACAO (DO ZERO)
# Execute: bash scripts/first-install.sh
# =====================================================

set -e

echo "=============================================="
echo "BBT CONNECT - Instalacao do Zero"
echo "=============================================="

# Variaveis de ambiente (AJUSTE ANTES DE EXECUTAR!)
export POSTGRES_DB="bbt_connect"
export POSTGRES_USER="bbt_user"
export POSTGRES_PASSWORD="Allg4m3Str8p00L6kdji2ceDB"
export JWT_SECRET="sua-chave-jwt-super-secreta-aqui-mude-isso"
export SESSION_SECRET="session-secret-key-mude-isso"
export VITE_API_URL="http://seu-servidor:3001"
export VITE_WS_URL="ws://seu-servidor:3001"

PROJECT_DIR="/opt/bbt-connect"

echo ""
echo "[1/7] Removendo stack antiga (se existir)..."
docker stack rm bbt_connect 2>/dev/null || true
sleep 10

echo ""
echo "[2/7] Removendo volumes antigos..."
docker volume rm bbt_connect_postgres_data 2>/dev/null || true
docker volume rm bbt_connect_redis_data 2>/dev/null || true
docker volume rm bbt_connect_backend_uploads 2>/dev/null || true
docker volume rm bbt_connect_backend_logs 2>/dev/null || true

echo ""
echo "[3/7] Navegando para diretorio do projeto..."
cd $PROJECT_DIR

echo ""
echo "[4/7] Buildando imagem do Frontend..."
docker build --no-cache \
    --build-arg VITE_API_URL=$VITE_API_URL \
    --build-arg VITE_WS_URL=$VITE_WS_URL \
    -t bbtconnect-frontend:latest \
    -f packages/frontend/Dockerfile .

echo ""
echo "[5/7] Buildando imagem do Backend..."
docker build --no-cache \
    -t bbtconnect-backend:latest \
    -f packages/backend/Dockerfile .

echo ""
echo "[6/7] Fazendo deploy da stack..."
docker stack deploy -c docker-compose.prod.yml bbt_connect

echo ""
echo "[7/7] Aguardando servicos iniciarem..."
sleep 30

echo ""
echo "Status dos servicos:"
docker service ls | grep bbt_connect

echo ""
echo "=============================================="
echo "Instalacao concluida!"
echo ""
echo "PROXIMO PASSO: Inicializar o banco de dados"
echo ""
echo "Execute o comando abaixo para inicializar o banco:"
echo ""
echo "  docker exec -i \$(docker ps -q -f name=bbt_connect_postgres) psql -U $POSTGRES_USER -d $POSTGRES_DB < scripts/init-db.sql"
echo ""
echo "Ou via migration automatica (apos banco subir):"
echo ""
echo "  docker exec \$(docker ps -q -f name=bbt_connect_backend) node dist/db/migrate.js"
echo ""
echo "=============================================="
