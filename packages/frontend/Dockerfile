# =====================================================
# FRONTEND BBT CONNECT - Dockerfile Multi-stage
# Build React/Vite + Nginx para produção
# =====================================================

FROM node:20-alpine AS base

RUN npm install -g pnpm

WORKDIR /app

# =====================================================
# STAGE 1: Instalar dependências
# =====================================================
FROM base AS deps

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# =====================================================
# STAGE 2: Build
# =====================================================
FROM base AS builder

# Variáveis de build (substituídas no build time)
ARG VITE_API_URL=http://localhost:3001
ARG VITE_WS_URL=ws://localhost:3001

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# =====================================================
# STAGE 3: Nginx (Produção)
# =====================================================
FROM nginx:alpine AS runner

# Configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build do React
COPY --from=builder /app/dist /usr/share/nginx/html

# Permissões
RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
