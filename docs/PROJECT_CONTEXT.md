# 🚀 BBT Connect - Contexto do Projeto

> **Última atualização:** 27/12/2024  
> **Projeto:** Sistema de Gestão Operacional BBT Transportes

---

## 📋 Visão Geral

**BBT Connect** é um sistema de auditoria e comunicação operacional em tempo real para a BBT Transportes, conectando os departamentos de Operação e Cadastro/GR com dashboards interativos e alertas.

---

## 🏢 Empresa

```yaml
empresa: BBT Transportes
segmento: Logística e transporte rodoviário de cargas
operacao: Multi-filial (matriz: MTZ)
erp: SSW (SQL Server)
```

| Nome | Telefone | Papel |
|------|----------|-------|
| Wilton | 5564984342283 | CEO/Diretor |
| Thaylor | 5562999892013 | Admin/Dev |

---

## 🔌 Credenciais e Conexões

### SQL Server (ERP SSW) - ⚠️ SOMENTE LEITURA
```env
MSSQL_HOST=177.136.206.200
MSSQL_PORT=1433
MSSQL_DATABASE=DBExpress
MSSQL_USER=mcp_readonly
MSSQL_PASSWORD=Cdq13xJqsl2t21DTUbbqol
```

### SSW Sistema Web
```env
SSW_BASE_URL=https://sistema.ssw.inf.br
SSW_DOMAIN=BBT
SSW_USER=thaylor
SSW_PASSWORD=thaylor1
```

### PostgreSQL (Local via Docker)
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=guardiao_ai
POSTGRES_USER=guardiao
POSTGRES_PASSWORD=guardiao_ai_2024
```

### Evolution API (WhatsApp)
```env
EVOLUTION_URL=https://api.bbttransportes.com.br
EVOLUTION_API_KEY=D1F1FE5FFE5B-483C-8E30-0465B88ECE7B
EVOLUTION_INSTANCE=disparador2026
```

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18.3+ | Framework |
| Vite | 7.3+ | Build tool |
| TypeScript | 5.9+ | Tipagem |
| TailwindCSS | 4.1+ | Estilos |
| TanStack Query | 5.90+ | Estado servidor |
| React Router | 6.30+ | Roteamento |
| Socket.io Client | 4.8+ | WebSocket |

### ⛔ PROIBIDO
- **Zustand** - NÃO USAR (causa lag)
- **Escrever no SQL Server** - SOMENTE LEITURA

---

## 📁 Estrutura do Projeto

```
c:\PROJETO CONSOLIDACAO\
├── docs/                    # Documentação
├── packages/
│   ├── frontend/            # React + Vite
│   │   ├── src/
│   │   │   ├── components/  # UI, layout, dashboard
│   │   │   ├── contexts/    # AuthContext
│   │   │   ├── hooks/       # useAuth, useApi
│   │   │   ├── pages/       # Dashboards
│   │   │   └── services/    # API, SSW
│   │   └── .env             # Configurações
│   └── shared/              # Tipos compartilhados
├── mcp-server/              # MCP para SQL Server
├── tests/                   # Scripts de teste SSW
├── docker-compose.yml       # PostgreSQL + Redis
└── .env                     # Variáveis globais
```

---

## 🚀 Como Iniciar o Projeto

### 1. Iniciar SSW-HELPER (Backend legado)
```bash
cd "c:\ML System Model\backup\BBT-PROJETOS-legacy\SSW-HELPER"
npm run dev
# Aguarde: 🚀 Servidor rodando em: http://localhost:3000
```

### 2. Iniciar Frontend
```bash
cd "c:\PROJETO CONSOLIDACAO\packages\frontend"
npm run dev
# Acesse: http://localhost:5173
```

### 3. Liberar Portas (se necessário)
```powershell
# Verificar porta 3000
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

# Liberar porta 3000
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

---

## 🔗 API SSW-HELPER

### Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login-auto` | Autenticação automática |
| GET | `/api/auth/status` | Status da sessão |
| GET | `/api/drivers/:cpf` | Buscar motorista por CPF |
| POST | `/api/operacoes/request` | Requisição genérica SSW |

### Exemplo: Buscar Motorista
```javascript
// 1. Autenticar
await fetch('http://localhost:3000/api/auth/login-auto', { method: 'POST' });

// 2. Buscar motorista
const response = await fetch('http://localhost:3000/api/drivers/12345678900');
const data = await response.json();
```

---

## ⚠️ Issues Conhecidas

### SSW Retornando 404
O SSW pode ocasionalmente retornar 404 para endpoints. Verificar:
1. Sessão está ativa (`/api/auth/status`)
2. Credenciais estão corretas
3. Endpoint correto (ssw0021 vs ssw0028)

---

## 🔧 Troubleshooting

### Página em branco
```bash
rm -rf node_modules/.vite
npm run dev
```

### EADDRINUSE (porta em uso)
```powershell
netstat -ano | findstr :5173
taskkill /PID [PID] /F
```

### TypeScript errors
```bash
cd packages/shared && pnpm build
cd ../frontend && pnpm install
```

---

## 📊 Módulos do Sistema

| Módulo | Responsável | Funcionalidades |
|--------|-------------|-----------------|
| Dashboard Operador | Jordana | Fila de análise, aprovar/rejeitar |
| Dashboard Gestão | Wilton | KPIs, alertas críticos |
| TV Display | Sala Operações | Cards grandes, auto-refresh |
| Alertas WhatsApp | Automático | Via n8n + Evolution API |

---

**Documento consolidado em:** 27/12/2024  
**Para uso em:** Claude Code / Gemini Code
