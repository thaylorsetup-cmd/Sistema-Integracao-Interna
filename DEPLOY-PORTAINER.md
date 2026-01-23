# 🚀 BBT Connect - Guia Completo de Deploy

> **Domínio**: https://control.bbttransportes.com.br  
> **Data**: Janeiro 2026

---

## 📋 Pré-Checklist

Antes de começar, confirme que você tem:

- [ ] Acesso ao Portainer
- [ ] `network_public` já existe no Portainer
- [ ] Traefik já está configurado e funcionando
- [ ] Acesso SSH ao servidor (ou terminal via Portainer)
- [ ] Git instalado no servidor

---

## 📁 Passo 1: Clonar o Repositório no Servidor

```bash
# Conectar via SSH ao servidor
ssh usuario@seu-servidor

# Ir para pasta de projetos
cd /opt  # ou onde você guarda seus projetos

# Clonar o repositório
git clone https://github.com/thaylorsetup-cmd/Sistema-Integracao-Interna.git bbt-connect

# Entrar na pasta
cd bbt-connect
```

---

## 📦 Passo 2: Criar os Volumes no Docker

Execute os comandos abaixo no servidor:

```bash
# Volumes para dados persistentes
docker volume create bbt_postgres_data
docker volume create bbt_uploads
docker volume create bbt_logs
docker volume create bbt_frontend_logs

# Verificar se foram criados
docker volume ls | grep bbt
```

**Resultado esperado:**
```
local     bbt_frontend_logs
local     bbt_logs
local     bbt_postgres_data
local     bbt_uploads
```

---

## 🏗️ Passo 3: Build das Imagens Docker

Ainda no servidor, na pasta do projeto:

```bash
cd /opt/bbt-connect  # ou onde você clonou

# Build do Frontend (React + Nginx)
docker build \
  -t bbt-connect-frontend:latest \
  --build-arg VITE_API_URL=/api \
  --build-arg VITE_WS_URL=wss://control.bbttransportes.com.br \
  ./packages/frontend

# Build do Backend (Node.js API)
docker build \
  -t bbt-connect-backend:latest \
  ./packages/backend

# Verificar se as imagens foram criadas
docker images | grep bbt-connect
```

**Resultado esperado:**
```
bbt-connect-frontend   latest   ...   ...   ...MB
bbt-connect-backend    latest   ...   ...   ...MB
```

---

## ⚙️ Passo 4: Configurar Variáveis de Ambiente

### Opção A: Variáveis no Portainer (Recomendado)

Ao criar a stack, adicione estas variáveis:

| Variável | Valor | Obrigatório |
|----------|-------|-------------|
| `POSTGRES_PASSWORD` | `SuaSenhaSegura123!@#` | ✅ SIM |
| `BETTER_AUTH_SECRET` | `chave_aleatoria_32_caracteres_minimo` | ✅ SIM |

### Gerar senha segura:

```bash
# Gerar senha aleatória
openssl rand -base64 32

# Exemplo de resultado:
# Ab3Cd5Ef7Gh9Ij1Kl3Mn5Op7Qr9St1Uv
```

---

## 📤 Passo 5: Deploy no Portainer

### 5.1 Acessar o Portainer
1. Abra o Portainer no navegador
2. Vá em **Stacks** → **Add stack**

### 5.2 Configurar a Stack
1. **Nome da stack**: `bbt-connect`
2. **Web editor**: Cole o conteúdo do arquivo `stack.yaml`

### 5.3 Adicionar Variáveis de Ambiente
Na seção **Environment variables**, clique em **Add environment variable** e adicione:

```
POSTGRES_PASSWORD = SuaSenhaSegura123!@#
BETTER_AUTH_SECRET = Ab3Cd5Ef7Gh9Ij1Kl3Mn5Op7Qr9St1Uv
```

### 5.4 Deploy
1. Clique em **Deploy the stack**
2. Aguarde todos os containers ficarem verdes (running)

---

## ✅ Passo 6: Verificar o Deploy

### 6.1 Verificar containers

No Portainer, vá em **Containers** e confirme:

| Container | Status | Porta |
|-----------|--------|-------|
| `bbt-connect_frontend_1` | Running | 80 |
| `bbt-connect_backend_1` | Running | 3001 |
| `bbt-connect_postgres_1` | Running | 5432 |

### 6.2 Verificar logs

Clique em cada container → **Logs** para ver se não há erros.

### 6.3 Testar URLs

```bash
# Health check da API
curl https://control.bbttransportes.com.br/api/health

# Resposta esperada:
# {"success":true,"message":"BBT Connect API is running",...}
```

### 6.4 Acessar no navegador

Abra: **https://control.bbttransportes.com.br**

Você deve ver a tela de login.

---

## 👤 Passo 7: Criar Primeiro Usuário Admin

### 7.1 Acessar o container do backend

No Portainer:
1. Vá em **Containers**
2. Clique em `bbt-connect_backend_1`
3. Clique em **Console** → **Connect**

Ou via SSH:
```bash
docker exec -it bbt-connect_backend_1 sh
```

### 7.2 Executar seed (se disponível)

```bash
node dist/db/seed.js
```

### 7.3 Ou criar usuário manualmente no banco

```bash
# Acessar o PostgreSQL
docker exec -it bbt-connect_postgres_1 psql -U bbt_user -d bbt_connect
```

```sql
-- Criar usuário admin
INSERT INTO users (email, nome, role, ativo) 
VALUES ('admin@bbttransportes.com.br', 'Administrador', 'admin', true);

-- Verificar
SELECT * FROM users;

-- Sair
\q
```

---

## 🔧 Troubleshooting

### Problema: Containers não sobem

```bash
# Ver logs detalhados
docker logs bbt-connect_backend_1 --tail 100
docker logs bbt-connect_frontend_1 --tail 100
docker logs bbt-connect_postgres_1 --tail 100
```

### Problema: Erro de conexão com banco

1. Verificar se PostgreSQL está healthy
2. Verificar variável `POSTGRES_PASSWORD`
3. Testar conexão:
```bash
docker exec -it bbt-connect_postgres_1 pg_isready -U bbt_user -d bbt_connect
```

### Problema: Frontend não carrega

1. Verificar logs do nginx
2. Confirmar que o build foi feito corretamente
3. Acessar `https://control.bbttransportes.com.br/health`

### Problema: API retorna 502

1. Backend pode não ter iniciado ainda (aguardar)
2. Verificar se healthcheck passou
3. Ver logs do backend

### Problema: SSL não funciona

1. Verificar se Traefik está rodando
2. Confirmar que `letsencryptresolver` está configurado
3. Verificar logs do Traefik

---

## 🔄 Atualizações Futuras

### Para atualizar o sistema:

```bash
# No servidor
cd /opt/bbt-connect

# Puxar novas alterações
git pull origin main

# Rebuildar imagens
docker build -t bbt-connect-frontend:latest \
  --build-arg VITE_API_URL=/api \
  --build-arg VITE_WS_URL=wss://control.bbttransportes.com.br \
  ./packages/frontend

docker build -t bbt-connect-backend:latest ./packages/backend

# No Portainer: Stacks → bbt-connect → Update the stack
```

---

## 📞 Suporte

Em caso de problemas, verificar:
1. Logs dos containers
2. Status da network_public
3. Configuração do Traefik
4. Variáveis de ambiente

---

**Deploy configurado para BBT Transportes** 🚛
