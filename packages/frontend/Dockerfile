# =====================================================
# FRONTEND BBT CONNECT - Dockerfile Multi-stage
# Build React/Vite + Nginx para producao
# IMPORTANTE: Build context deve ser a RAIZ da monorepo
# docker build -f packages/frontend/Dockerfile .
# =====================================================

FROM node:20-alpine AS base

RUN npm install -g pnpm

WORKDIR /app

# =====================================================
# STAGE 1: Instalar dependencias
# =====================================================
FROM base AS deps

# Copiar workspace config e lockfile da raiz
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/

RUN cd packages/frontend && pnpm install --frozen-lockfile || pnpm install

# =====================================================
# STAGE 2: Build
# =====================================================
FROM base AS builder

# Variaveis de build (substituidas no build time)
ARG VITE_API_URL=http://localhost:3001
ARG VITE_WS_URL=ws://localhost:3001

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Copiar node_modules do stage deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/frontend/node_modules ./packages/frontend/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copiar codigo fonte do shared e frontend
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend

# Build shared primeiro (gera dist com tipos)
RUN cd packages/shared && pnpm build

# Build frontend
RUN cd packages/frontend && pnpm build

# =====================================================
# STAGE 3: Nginx (Producao)
# =====================================================
FROM nginx:alpine AS runner

# Configuracao customizada do Nginx
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build do React
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# Permissoes
RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
