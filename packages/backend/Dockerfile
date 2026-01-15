# =====================================================
# BACKEND BBT CONNECT - Dockerfile Multi-stage
# Otimizado para produção no Portainer
# =====================================================

FROM node:20-alpine AS base

# Instalar pnpm
RUN npm install -g pnpm

# Dependências de build
RUN apk add --no-cache python3 make g++

WORKDIR /app

# =====================================================
# STAGE 1: Instalar dependências
# =====================================================
FROM base AS deps

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod=false

# =====================================================
# STAGE 2: Build
# =====================================================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# =====================================================
# STAGE 3: Produção
# =====================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

# Copiar apenas produção
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Criar pasta de uploads com permissões
RUN mkdir -p /app/uploads /app/logs
RUN chown -R backend:nodejs /app

USER backend

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
