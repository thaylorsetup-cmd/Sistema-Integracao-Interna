# =====================================================
# BBT CONNECT BACKEND - DOCKERFILE
# Build multi-stage para producao
# =====================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiar arquivos de dependencias
COPY package.json ./

# Instalar dependencias (incluindo devDependencies para build)
RUN pnpm install

# Copiar codigo fonte
COPY . .

# Build TypeScript
RUN pnpm build

# =====================================================
# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Criar usuario nao-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar arquivos de dependencias
COPY package.json ./

# Instalar apenas dependencias de producao
RUN pnpm install --prod

# Copiar build do stage anterior
COPY --from=builder /app/dist ./dist

# Copiar migracoes SQL
COPY --from=builder /app/src/db/migrations ./dist/db/migrations

# Criar diretorios necessarios
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs /app

# Usar usuario nao-root
USER nodejs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Comando de inicializacao
CMD ["node", "dist/index.js"]
