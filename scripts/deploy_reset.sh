#!/bin/bash

echo "======================================================="
echo "🔄 INICIANDO RESET TOTAL DO DEPLOY - BBT CONNECT"
echo "======================================================="

# 1. Remover Stack Atual
echo "🛑 Parando Stack 'bbt_connect'..."
docker stack rm bbt_connect

echo "⏳ Aguardando 20 segundos para limpeza completa..."
sleep 20

# 2. Rebuildar Imagens (Para garantir que pegue o novo nginx.conf e codigos)
echo "🏗️  Rebuildando imagem do BACKEND..."
docker build -t bbtconnect-backend:latest -f packages/backend/Dockerfile .

echo "🏗️  Rebuildando imagem do FRONTEND..."
docker build -t bbtconnect-frontend:latest -f packages/frontend/Dockerfile .

# 3. Deploy Novo
echo "🚀 Subindo Stack novamente..."
docker stack deploy -c docker-compose.prod.yml bbt_connect

echo "======================================================="
echo "✅ DEPLOY SOLICITADO COM SUCESSO!"
echo "======================================================="
echo "Monitorando serviços (Ctrl+C para sair)..."
watch docker stack services bbt_connect
