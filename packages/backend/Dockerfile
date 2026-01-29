# =====================================================
# BBT CONNECT BACKEND - DOCKERFILE (MONOREPO)
# Build multi-stage para producao com suporte a pnpm workspace
# IMPORTANTE: Build context deve ser a RAIZ da monorepo
# docker build -f packages/backend/Dockerfile .
# =====================================================

# Stage 1: Instalar dependencias
FROM node:20-alpine AS deps

# Instalar pnpm globalmente
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar workspace config e lockfile da raiz
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/backend/package.json ./packages/backend/

# Instalar dependencias do backend (incluindo devDependencies para build)
RUN cd packages/backend && pnpm install --frozen-lockfile

# =====================================================
# Stage 2: Build TypeScript
FROM node:20-alpine AS builder

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar node_modules do stage deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/backend/node_modules ./packages/backend/node_modules

# Copiar codigo fonte do backend
COPY packages/backend ./packages/backend

# Build TypeScript com tsup
RUN cd packages/backend && pnpm build

# =====================================================
# Stage 3: Production
FROM node:20-alpine AS production

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Criar usuario nao-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar workspace config (necessario para pnpm install --prod)
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/backend/package.json ./packages/backend/

# Instalar apenas dependencias de producao
RUN cd packages/backend && pnpm install --prod --frozen-lockfile

# Copiar build do stage anterior (mantendo estrutura monorepo)
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

# Copiar arquivos SQL de migrations (nao sao compilados pelo TypeScript)
COPY --from=builder /app/packages/backend/src/db/migrations ./packages/backend/dist/db/migrations

# Criar diretorios necessarios
RUN mkdir -p packages/backend/uploads packages/backend/logs && \
    chown -R nodejs:nodejs /app

# Usar usuario nao-root
USER nodejs

# Mudar para o diretório do backend
WORKDIR /app/packages/backend

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Comando de inicializacao
CMD ["node", "dist/index.js"]
