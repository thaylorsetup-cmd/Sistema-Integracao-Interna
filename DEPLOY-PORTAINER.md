# 🚀 Guia de Deploy - BBT Connect no Portainer

## Domínio: https://control.bbttransportes.com.br

---

## 📋 Pré-requisitos no Servidor

### 1. Criar os volumes necessários no Portainer

Antes de fazer deploy da stack, crie os seguintes volumes:

```bash
docker volume create bbt_postgres_data
docker volume create bbt_uploads
docker volume create bbt_logs
docker volume create bbt_frontend_logs
```

Ou via Portainer:
1. Vá em **Volumes** → **Add volume**
2. Crie cada um dos volumes acima

### 2. Build das imagens (se não estiver usando registry)

No servidor, clone o repositório e faça o build:

```bash
git clone https://github.com/seu-usuario/bbt-connect.git
cd bbt-connect

# Build do frontend
docker build -t bbt-connect-frontend:latest \
  --build-arg VITE_API_URL=https://control.bbttransportes.com.br/api \
  --build-arg VITE_WS_URL=wss://control.bbttransportes.com.br \
  ./packages/frontend

# Build do backend
docker build -t bbt-connect-backend:latest ./packages/backend
```

---

## 🔧 Deploy no Portainer

### Passo 1: Criar a Stack

1. Acesse o Portainer
2. Vá em **Stacks** → **Add stack**
3. Nome: `bbt-connect`
4. Cole o conteúdo do arquivo `stack.yaml`

### Passo 2: Configurar variáveis de ambiente

Na seção "Environment variables" adicione:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `POSTGRES_PASSWORD` | `SuaSenhaForte123!@#` | Senha do banco PostgreSQL |
| `BETTER_AUTH_SECRET` | `chave_32_caracteres_minimo` | Secret para autenticação |

### Passo 3: Deploy

1. Clique em **Deploy the stack**
2. Aguarde os containers subirem
3. Verifique os logs de cada serviço

---

## 🌐 Como vai funcionar

### Estrutura de URLs

| URL | Serviço | Descrição |
|-----|---------|-----------|
| `https://control.bbttransportes.com.br/` | Frontend | Página inicial (redireciona para /login) |
| `https://control.bbttransportes.com.br/login` | Frontend | Tela de login |
| `https://control.bbttransportes.com.br/dashboard/operador` | Frontend | Dashboard do operador |
| `https://control.bbttransportes.com.br/dashboard/gestao` | Frontend | Dashboard de gestão |
| `https://control.bbttransportes.com.br/dashboard/cadastro-gr` | Frontend | Fila de cadastros |
| `https://control.bbttransportes.com.br/auditoria` | Frontend | Auditoria |
| `https://control.bbttransportes.com.br/configuracoes` | Frontend | Configurações |
| `https://control.bbttransportes.com.br/api/*` | Backend | API REST |
| `https://control.bbttransportes.com.br/socket.io/*` | Backend | WebSocket |

### Roteamento Traefik

```
control.bbttransportes.com.br
├── /api/*        → Backend (porta 3001)
├── /socket.io/*  → Backend (WebSocket)
└── /*            → Frontend (nginx, porta 80)
```

---

## 🔒 SSL/HTTPS

O Traefik já está configurado para:
- Gerar certificado SSL automaticamente via Let's Encrypt
- Renovar certificados automaticamente
- Redirecionar HTTP para HTTPS

---

## ✅ Verificação pós-deploy

### 1. Verificar se os containers estão rodando

```bash
docker ps | grep bbt
```

### 2. Verificar logs

```bash
# Frontend
docker logs bbt-connect_frontend_1

# Backend
docker logs bbt-connect_backend_1

# PostgreSQL
docker logs bbt-connect_postgres_1
```

### 3. Testar endpoints

```bash
# Health check do backend
curl https://control.bbttransportes.com.br/api/health

# Acessar o frontend
curl -I https://control.bbttransportes.com.br/
```

---

## 🐛 Troubleshooting

### Problema: Frontend não carrega

1. Verifique logs do nginx: `docker logs bbt-connect_frontend_1`
2. Confirme que o build foi feito com as variáveis corretas

### Problema: API retorna erro 502

1. Verifique se o backend está rodando
2. Verifique logs: `docker logs bbt-connect_backend_1`
3. Confirme conectividade com PostgreSQL

### Problema: Banco não conecta

1. Verifique se o PostgreSQL está healthy
2. Confirme a senha nas variáveis de ambiente
3. Verifique logs: `docker logs bbt-connect_postgres_1`

### Problema: WebSocket não funciona

1. Verifique se a rota `/socket.io` está no Traefik
2. Confirme `VITE_WS_URL=wss://control.bbttransportes.com.br`

---

## 📝 Primeiro acesso

Após o deploy, você precisará criar o primeiro usuário admin.

### Opção 1: Via seed (recomendado)

```bash
docker exec -it bbt-connect_backend_1 node dist/db/seed.js
```

### Opção 2: Diretamente no banco

```bash
docker exec -it bbt-connect_postgres_1 psql -U bbt_user -d bbt_connect
```

```sql
INSERT INTO users (email, nome, role, ativo) 
VALUES ('admin@bbttransportes.com.br', 'Administrador', 'admin', true);
```

---

**Desenvolvido para BBT Transportes** 🚛
