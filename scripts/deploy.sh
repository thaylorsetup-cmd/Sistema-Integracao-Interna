#!/bin/bash
# =====================================================
# BBT CONNECT - SCRIPT DE DEPLOY COMPLETO
# Execute: bash scripts/deploy.sh
# =====================================================

set -e

echo "=============================================="
echo "BBT CONNECT - Deploy Completo"
echo "=============================================="

# Variaveis de ambiente (ajuste conforme necessário)
export VITE_API_URL=${VITE_API_URL:-"http://seu-servidor:3001"}
export VITE_WS_URL=${VITE_WS_URL:-"ws://seu-servidor:3001"}

# Diretorio do projeto
PROJECT_DIR="/opt/bbt-connect"
cd $PROJECT_DIR

echo ""
echo "[1/5] Atualizando codigo fonte..."
git pull origin main

echo ""
echo "[2/5] Buildando imagem do Frontend..."
docker build --no-cache \
    --build-arg VITE_API_URL=$VITE_API_URL \
    --build-arg VITE_WS_URL=$VITE_WS_URL \
    -t bbtconnect-frontend:latest \
    -f packages/frontend/Dockerfile .

echo ""
echo "[3/5] Buildando imagem do Backend..."
docker build --no-cache \
    -t bbtconnect-backend:latest \
    -f packages/backend/Dockerfile .

echo ""
echo "[4/5] Atualizando servicos..."
docker service update --image bbtconnect-frontend:latest --force bbt_connect_frontend
docker service update --image bbtconnect-backend:latest --force bbt_connect_backend

echo ""
echo "[5/5] Verificando status dos servicos..."
sleep 10
docker service ls | grep bbt_connect

echo ""
echo "=============================================="
echo "Deploy concluido com sucesso!"
echo "=============================================="
