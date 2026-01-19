# BBT Connect - Documentacao Completa do Frontend

> **Versao:** 0.0.1
> **Nome:** @guardiao/frontend (BBT Connect / Guardiao V2)
> **Proposito:** Sistema de cadastro de motoristas e gestao de documentos para transportadora
> **Data:** Janeiro 2026

---

## Indice

1. [Visao Geral](#1-visao-geral)
2. [Stack Tecnologico](#2-stack-tecnologico)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Paginas e Rotas](#4-paginas-e-rotas)
5. [Componentes](#5-componentes)
6. [Fluxos de Negocio](#6-fluxos-de-negocio)
7. [Tipos TypeScript](#7-tipos-typescript)
8. [Sistema de Autenticacao](#8-sistema-de-autenticacao)
9. [Endpoints do Backend](#9-endpoints-do-backend)
10. [Integracoes](#10-integracoes)
11. [Validacoes](#11-validacoes)
12. [Configuracoes](#12-configuracoes)
13. [Deploy](#13-deploy)

---

## 1. Visao Geral

### 1.1 Sobre o Sistema

O BBT Connect e um sistema de gestao de cadastro de motoristas e documentos para a transportadora BBT Transportes. O sistema permite:

- **Operadores** enviarem documentos de motoristas para cadastro
- **Analistas GR** (Gerenciadora de Risco) aprovarem ou rejeitarem cadastros
- **Gestores** visualizarem KPIs e indicadores de performance
- **Administradores** gerenciarem usuarios e configuracoes

### 1.2 Arquitetura Frontend

```
┌─────────────────────────────────────────────────────────────┐
│                      BBT CONNECT                            │
│                     (React 18 SPA)                          │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   React       │   │   TanStack    │   │   Context     │
│   Router      │   │   Query       │   │   API         │
│  (Routing)    │   │  (Data)       │   │  (Auth)       │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │       Axios           │
                │   (HTTP Client)       │
                └───────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Backend     │   │  SSW-HELPER   │   │   WebSocket   │
│   API         │   │   (ERP)       │   │   Server      │
│  :3001/api    │   │    :3000      │   │   (Socket.io) │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## 2. Stack Tecnologico

### 2.1 Dependencias Principais

| Tecnologia | Versao | Uso |
|------------|--------|-----|
| React | 18.2.0 | Framework UI |
| TypeScript | 5.9.3 | Type-safety |
| Vite | 7.2.4 | Build tool |
| Tailwind CSS | 4.1.0 | Estilizacao |
| React Router DOM | 6.21.0 | Roteamento client-side |
| TanStack React Query | 5.17.0 | Gerenciamento de estado assincrono |
| Axios | 1.6.5 | Cliente HTTP |
| Socket.io-client | 4.6.1 | WebSocket em tempo real |
| React Hook Form | 7.49.0 | Gerenciamento de formularios |
| Zod | 3.24.1 | Validacao TypeScript-first |
| @hookform/resolvers | 3.3.4 | Integracao Zod + React Hook Form |
| Lucide React | 0.312.0 | Icones SVG |
| Framer Motion | 12.23.26 | Animacoes fluidas |
| Recharts | 3.6.0 | Graficos React |
| MapLibre GL | 5.15.0 | Mapa interativo open-source |
| Turf.js | 7.3.1 | Analise geoespacial |
| date-fns | 3.0.0 | Manipulacao de datas |
| clsx | 2.1.0 | Merge condicional de classes |
| tailwind-merge | 2.2.0 | Merge inteligente de classes Tailwind |

### 2.2 DevDependencies

| Tecnologia | Versao | Uso |
|------------|--------|-----|
| TypeScript ESLint | 8.46.4 | Linting tipado |
| PostCSS | 8.4.32 | Transformacao CSS |
| Autoprefixer | 10.4.16 | Prefixos CSS automaticos |
| @vitejs/plugin-react | - | Suporte JSX |

### 2.3 Scripts npm

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 3. Estrutura de Pastas

```
packages/frontend/
├── public/                          # Arquivos estaticos
│   └── favicon.ico
├── src/
│   ├── assets/                      # Icones, imagens, videos
│   │   ├── icons/
│   │   └── videos/
│   │
│   ├── components/
│   │   ├── ui/                      # Componentes base (26 componentes)
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── CardPro.tsx
│   │   │   ├── CPFSearchInput.tsx
│   │   │   ├── DataComparisonCard.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── DriverInfoCard.tsx
│   │   │   ├── GlassCard.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── InputPro.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── Progress.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Separator.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── AnimatedBackground.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── layout/                  # Componentes de layout (4)
│   │   │   ├── MainLayout.tsx       # Layout principal com Header + Sidebar
│   │   │   ├── Header.tsx           # Cabecalho global
│   │   │   ├── Sidebar.tsx          # Menu lateral
│   │   │   ├── Container.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── dashboard/               # Componentes especificos do dashboard (2)
│   │   │   ├── BBTMatrixMap.tsx     # Mapa com rastreamento de frota
│   │   │   ├── FleetMapWidget.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts                 # Exportador central
│   │
│   ├── pages/                       # Paginas da aplicacao (13 paginas)
│   │   ├── auth/
│   │   │   ├── Login.tsx            # Login com glassmorphism
│   │   │   └── index.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardOperador.tsx     # Envio de documentos (checklist)
│   │   │   ├── DashboardGestao.tsx       # Dashboard de analise
│   │   │   ├── DashboardCadastroGR.tsx   # Cadastro de Gerenciadora de Risco
│   │   │   ├── KpiDetalhes.tsx           # Detalhes de KPIs
│   │   │   ├── TvDisplay.tsx             # Display TV (legacy)
│   │   │   └── index.ts
│   │   │
│   │   ├── tv/                           # Telas para TV (4)
│   │   │   ├── TvMapa.tsx               # Mapa completo em tela cheia
│   │   │   ├── TvKpis.tsx               # KPIs em tempo real
│   │   │   ├── TvCadastros.tsx          # Status de cadastros
│   │   │   ├── TvAlertas.tsx            # Alertas do sistema
│   │   │   └── index.ts
│   │   │
│   │   ├── Auditoria.tsx            # Logs de auditoria
│   │   ├── Notificacoes.tsx         # Sistema de notificacoes
│   │   ├── Configuracoes.tsx        # Configuracoes de usuario
│   │   └── index.ts
│   │
│   ├── contexts/                    # React Context API
│   │   ├── AuthContext.tsx          # Autenticacao e permissoes
│   │   ├── useAuth.ts               # Hook do contexto
│   │   └── index.ts
│   │
│   ├── hooks/                       # Custom Hooks (2)
│   │   ├── useAuth.ts               # Hook de autenticacao
│   │   ├── useApi.ts                # Hook para requisicoes HTTP
│   │   └── index.ts
│   │
│   ├── services/                    # Servicos de API e dados
│   │   ├── api.ts                   # Cliente Axios configurado
│   │   ├── mockApi.ts               # Mock API para testes
│   │   ├── mockDatabase.ts          # Base de dados mock
│   │   ├── mockWebSocket.ts         # WebSocket mock
│   │   ├── sswService.ts            # Integracao com SSW-HELPER (ERP)
│   │   └── index.ts
│   │
│   ├── types/                       # Definicoes TypeScript
│   │   ├── index.ts                 # Tipos globais
│   │   └── ssw.types.ts             # Tipos especificos do SSW-HELPER
│   │
│   ├── utils/                       # Utilitarios (4 arquivos)
│   │   ├── classnames.ts            # Merge de classes Tailwind (cn)
│   │   ├── formatters.ts            # Formatar datas, moedas, numeros
│   │   ├── validators.ts            # Validar CPF, email, telefone
│   │   └── index.ts
│   │
│   ├── App.tsx                      # Componente raiz com rotas
│   ├── App.css                      # Estilos do App
│   ├── index.css                    # Estilos globais (Tailwind)
│   └── main.tsx                     # Ponto de entrada React
│
├── dist/                            # Build de producao
├── node_modules/                    # Dependencias
├── .env                             # Variaveis de ambiente
├── .env.example                     # Exemplo de variaveis
├── package.json                     # Dependencias e scripts
├── vite.config.ts                   # Configuracao Vite
├── tsconfig.json                    # TypeScript config (raiz)
├── tsconfig.app.json                # TypeScript config (aplicacao)
├── tsconfig.node.json               # TypeScript config (Node)
├── tailwind.config.js               # Tema BBT personalizado
├── postcss.config.js                # PostCSS config
├── eslint.config.js                 # ESLint config
├── Dockerfile                       # Build para producao
├── nginx.conf                       # Configuracao Nginx
└── index.html                       # HTML base
```

---

## 4. Paginas e Rotas

### 4.1 Mapa de Rotas

| Rota | Componente | Protecao | Layout | Descricao |
|------|------------|----------|--------|-----------|
| `/login` | Login.tsx | Publica | Nenhum | Autenticacao do usuario |
| `/dashboard/operador` | DashboardOperador.tsx | Auth | MainLayout | Upload de documentos |
| `/dashboard/gestao` | DashboardGestao.tsx | Auth + Permissao | MainLayout | KPIs e indicadores |
| `/dashboard/cadastro-gr` | DashboardCadastroGR.tsx | Auth + Permissao | MainLayout | Fila de aprovacao |
| `/dashboard/kpi/:tipo` | KpiDetalhes.tsx | Auth | MainLayout | Detalhes de KPI especifico |
| `/auditoria` | Auditoria.tsx | Auth + Admin/Gestor | MainLayout | Logs de auditoria |
| `/notificacoes` | Notificacoes.tsx | Auth | MainLayout | Sistema de notificacoes |
| `/configuracoes` | Configuracoes.tsx | Auth | MainLayout | Configuracoes de usuario |
| `/tv/mapa` | TvMapa.tsx | Publica | Nenhum | Mapa fullscreen |
| `/tv/kpis` | TvKpis.tsx | Publica | Nenhum | KPIs fullscreen |
| `/tv/cadastros` | TvCadastros.tsx | Publica | Nenhum | Cadastros fullscreen |
| `/tv/alertas` | TvAlertas.tsx | Publica | Nenhum | Alertas fullscreen |
| `/tv-display` | TvDisplay.tsx | Publica | Nenhum | Legacy TV Display |
| `/` | - | - | - | Redirect para `/dashboard/operador` |
| `/*` | - | - | - | Catch-all redirect para `/dashboard/operador` |

### 4.2 Configuracao de Rotas (App.tsx)

```typescript
// Estrutura de rotas do React Router
<Routes>
  {/* Rotas Publicas */}
  <Route path="/login" element={<Login />} />
  <Route path="/tv-display" element={<TvDisplay />} />
  <Route path="/tv/mapa" element={<TvMapa />} />
  <Route path="/tv/kpis" element={<TvKpis />} />
  <Route path="/tv/cadastros" element={<TvCadastros />} />
  <Route path="/tv/alertas" element={<TvAlertas />} />

  {/* Rotas Protegidas (com MainLayout) */}
  <Route element={<MainLayout />}>
    <Route path="/dashboard/operador" element={<DashboardOperador />} />
    <Route path="/dashboard/gestao" element={<DashboardGestao />} />
    <Route path="/dashboard/cadastro-gr" element={<DashboardCadastroGR />} />
    <Route path="/dashboard/kpi/:tipo" element={<KpiDetalhes />} />
    <Route path="/auditoria" element={<Auditoria />} />
    <Route path="/notificacoes" element={<Notificacoes />} />
    <Route path="/configuracoes" element={<Configuracoes />} />
  </Route>

  {/* Default */}
  <Route path="/" element={<Navigate to="/dashboard/operador" />} />
  <Route path="*" element={<Navigate to="/dashboard/operador" />} />
</Routes>
```

---

## 5. Componentes

### 5.1 UI Components (26 componentes)

| Componente | Arquivo | Descricao |
|------------|---------|-----------|
| Button | Button.tsx | Botao com variantes (primary, secondary, ghost, destructive) |
| Card | Card.tsx | Cartao com estrutura (Header, Title, Description, Content, Footer) |
| CardPro | CardPro.tsx | Cartao profissional com glassmorphism |
| Input | Input.tsx | Campo de entrada com focus states |
| InputPro | InputPro.tsx | Input avancado com mascaras e validacao |
| Select | Select.tsx | Dropdown customizado |
| Textarea | Textarea.tsx | Area de texto |
| Dialog | Dialog.tsx | Modal/Dialogo com backdrop |
| Badge | Badge.tsx | Labels e tags com variantes |
| Avatar | Avatar.tsx | Avatar de usuario com fallback |
| Progress | Progress.tsx | Barra de progresso linear e circular |
| Loading | Loading.tsx | Spinner de carregamento |
| Skeleton | Skeleton.tsx | Placeholder para loading state |
| Toast | Toast.tsx | Notificacoes no canto da tela |
| GlassCard | GlassCard.tsx | Cartao com efeito glassmorphism |
| AnimatedBackground | AnimatedBackground.tsx | Fundo animado com SVG/Video |
| CPFSearchInput | CPFSearchInput.tsx | Input especializado para busca de CPF |
| DriverInfoCard | DriverInfoCard.tsx | Cartao de informacao de motorista |
| DataComparisonCard | DataComparisonCard.tsx | Cartao comparativo de dados |
| Separator | Separator.tsx | Divisor horizontal/vertical |

### 5.2 Layout Components (4 componentes)

| Componente | Arquivo | Descricao |
|------------|---------|-----------|
| MainLayout | MainLayout.tsx | Layout principal: Header + Sidebar + Content |
| Header | Header.tsx | Cabecalho com logo, navegacao, perfil |
| Sidebar | Sidebar.tsx | Menu lateral com navegacao principal |
| Container | Container.tsx | Wrapper de container padronizado |

### 5.3 Dashboard Components (2 componentes)

| Componente | Arquivo | Descricao |
|------------|---------|-----------|
| BBTMatrixMap | BBTMatrixMap.tsx | Mapa com rastreamento de frota (MapLibre GL) |
| FleetMapWidget | FleetMapWidget.tsx | Widget de frota para dashboard |

---

## 6. Fluxos de Negocio

### 6.1 Fluxo Principal: Cadastro de Motorista

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE CADASTRO DE MOTORISTA                       │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐      ┌─────────────────┐      ┌──────────────────┐
  │  LOGIN   │ ──── │  Dashboard      │ ──── │  Upload de       │
  │ Operador │      │  Operador       │      │  Documentos      │
  └──────────┘      └─────────────────┘      └──────────────────┘
                                                      │
                    ┌─────────────────────────────────┘
                    │
                    ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │                  DOCUMENTOS OBRIGATORIOS (8)                     │
  ├──────────────────┬──────────────────┬──────────────────┬─────────┤
  │ 1. CRLV's        │ 2. ANTT          │ 3. CNH           │ 4. End. │
  │ (Cavalo/Carreta) │ (Veiculo)        │ (Motorista)      │ Comp.   │
  ├──────────────────┼──────────────────┼──────────────────┼─────────┤
  │ 5. Dados         │ 6. PAMCARD/TAG   │ 7. GR            │ 8. RCV  │
  │ Bancarios        │                  │ (Gerenc. Risco)  │ (Cert.) │
  └──────────────────┴──────────────────┴──────────────────┴─────────┘
                                │
                    ┌───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Classificacao de     │
        │  Documentos (Modal)   │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐      ┌─────────────────────┐
        │  Enviar para Fila     │ ──── │  Dashboard          │
        │  de Aprovacao         │      │  Cadastro GR        │
        └───────────────────────┘      └─────────────────────┘
                                                │
                    ┌───────────────────────────┘
                    │
                    ▼
        ┌───────────────────────────────────────────────────┐
        │              FILA KANBAN                          │
        ├─────────────────┬─────────────────┬───────────────┤
        │   PENDENTES     │   EM ANALISE    │  CONCLUIDOS   │
        │   (Aguardando)  │   (Analisando)  │  (Aprovados/  │
        │                 │                 │   Rejeitados) │
        └─────────────────┴─────────────────┴───────────────┘
                                │
                    ┌───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│   APROVAR     │       │   REJEITAR    │
│   Cadastro    │       │   (c/ motivo) │
└───────────────┘       └───────────────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Motorista Cadastrado │
        │  no Sistema SSW       │
        └───────────────────────┘
```

### 6.2 Fluxo de Analise GR

```
┌────────────────────────────────────────────────────────────────┐
│                 FLUXO DE ANALISE GR                            │
└────────────────────────────────────────────────────────────────┘

1. Analista acessa Dashboard Cadastro GR
2. Visualiza fila Kanban com cadastros pendentes
3. Clica em um cadastro para ver detalhes
4. Modal exibe:
   - Informacoes do operador que enviou
   - Data/hora de envio
   - Tempo de espera
   - Lista de documentos por tipo
   - Botao para download individual ou em lote
5. Analista pode:
   - Iniciar Analise (move para "Em Analise")
   - Aprovar (move para "Concluidos")
   - Rejeitar com motivo (move para "Concluidos")
6. Comparacao opcional com dados do SSW (ERP)
```

### 6.3 Fluxo de Autenticacao

```
┌────────────────────────────────────────────────────────────────┐
│                 FLUXO DE AUTENTICACAO                          │
└────────────────────────────────────────────────────────────────┘

1. Usuario acessa /login
2. Insere email e senha
3. Sistema valida credenciais
4. Se valido:
   - Gera token JWT
   - Salva token em localStorage (authToken)
   - Salva dados do usuario em localStorage (user)
   - Redireciona para /dashboard/operador
5. Se invalido:
   - Exibe mensagem de erro
   - Usuario tenta novamente

Logout:
1. Usuario clica em "Sair"
2. Sistema remove authToken e user do localStorage
3. Redireciona para /login

Verificacao de Sessao:
- Interceptor Axios verifica token em cada requisicao
- Se receber HTTP 401, limpa localStorage e redireciona para /login
```

### 6.4 Fluxo TV Display

```
┌────────────────────────────────────────────────────────────────┐
│                 FLUXO TV DISPLAY                               │
└────────────────────────────────────────────────────────────────┘

/tv/mapa     → Mapa de rastreamento de frota em tempo real
/tv/kpis     → Metricas e KPIs operacionais em fullscreen
/tv/cadastros→ Status de cadastros (aprovados/pendentes/rejeitados)
/tv/alertas  → Central de alertas criticos

Caracteristicas:
- Sem header/sidebar (fullscreen)
- Atualizacao automatica (tempo real)
- Ideal para NOCs (Network Operation Centers)
- Cores de alta visibilidade
```

---

## 7. Tipos TypeScript

### 7.1 Tipos de Autenticacao

```typescript
// src/types/index.ts

// Roles de usuario
type UserRole = 'admin' | 'gestor' | 'operacional' | 'cadastro' | 'comercial';

// Permissoes granulares
interface Permission {
  // Dashboards
  viewDashboardOperador: boolean;
  viewDashboardGestao: boolean;
  viewDashboardCadastroGR: boolean;
  viewTvDisplay: boolean;

  // Auditoria
  viewAuditoria: boolean;
  exportAuditoria: boolean;

  // Configuracoes
  viewConfiguracoesPessoais: boolean;
  viewConfiguracoesSistema: boolean;

  // Gerenciamento
  manageUsers: boolean;
  manageIntegracoes: boolean;

  // Acoes em cadastros
  aprovarCadastros: boolean;
  editarCadastros: boolean;
  criarCadastros: boolean;
  deletarCadastros: boolean;
}

// Usuario completo
interface User {
  id: string;
  name: string;
  email: string;
  telefone?: string;
  role: UserRole;
  departamento: string;
  avatar?: string;
  permissions: Permission;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Estado de autenticacao
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
```

### 7.2 Tipos de Resposta de API

```typescript
// Resposta padrao de API
interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Resposta paginada
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### 7.3 Tipos de Motorista e Veiculo (SSW)

```typescript
// src/types/ssw.types.ts

// Dados do veiculo
interface VehicleData {
  placa: string;
  tipo: 'cavalo' | 'carreta' | 'outro';
  renavam?: string;
  antt?: string;
  situacao: 'ativo' | 'inativo' | 'pendente';
}

// Dados do motorista
interface DriverData {
  cpf: string;
  nome: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  situacao: 'ativo' | 'inativo' | 'pendente' | 'bloqueado';
  dataCadastro?: string;

  // Dados CNH
  numeroCNH?: string;
  categoriaCNH?: string;
  vencimentoCNH?: string;
  cnhValida?: boolean;

  // Veiculos associados
  veiculosAssociados?: VehicleData[];

  // Metadados
  ultimaAtualizacao?: string;
  fonte: 'ssw';
}

// Estado de busca de motorista
interface DriverSearchState {
  isLoading: boolean;
  data: DriverData | null;
  error: string | null;
  lastSearchedCPF: string | null;
}

// Comparacao de dados
interface DataComparison {
  field: string;
  label: string;
  submittedValue: string | undefined;
  sswValue: string | undefined;
  matches: boolean;
}
```

### 7.4 Tipos de Documentos e Fila

```typescript
// Arquivo de documento
interface DocumentFile {
  id: string;
  type: string; // crlv, antt, cnh, endereco, bancario, pamcard, gr, rcv, outros
  customDescription?: string;
  filename: string;
  url: string; // URL para download/visualizacao
  uploadedAt?: string;
}

// Arquivo em upload
interface UploadedFile {
  id: string;
  file: File;
  type: string | null; // null ate classificacao
  customDescription?: string;
  preview?: string; // Para imagens (data URL)
}

// Submissao de cadastro
interface Submission {
  id: number;
  operador: string;
  operadorId: string;
  dataEnvio: string; // DD/MM/YYYY
  horaEnvio: string; // HH:MM
  status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';
  documentos: DocumentFile[];
  tempoEspera: string; // "2h 30min"
  prioridade: 'normal' | 'alta' | 'urgente';
  motivo_rejeicao?: string;
  aprovado_por?: string;
  aprovado_em?: string;
}
```

### 7.5 Tipos de Auditoria

```typescript
// Tipos de log
type LogTipo =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CRIAR'
  | 'EDITAR'
  | 'DELETAR'
  | 'APROVAR'
  | 'REJEITAR'
  | 'VISUALIZAR'
  | 'EXPORTAR'
  | 'CONFIG';

// Log de auditoria
interface LogAuditoria {
  id: string;
  timestamp: string; // ISO 8601
  usuarioId: string;
  usuarioNome: string;
  tipo: LogTipo;
  modulo: string; // 'auth', 'cadastro', 'dashboard', etc
  descricao: string;
  detalhes?: Record<string, unknown>;
  ip?: string;
}
```

### 7.6 Tipos de Configuracao

```typescript
// Configuracao de usuario
interface ConfiguracaoUsuario {
  tema: 'dark' | 'light' | 'system';
  idioma: 'pt-BR' | 'en-US' | 'es-ES';
  notificacoesEmail: boolean;
  notificacoesWhatsApp: boolean;
  notificacoesPush: boolean;
  somNotificacoes: boolean;
}

// Configuracao do sistema
interface ConfiguracaoSistema {
  nomeEmpresa: string;
  logoUrl: string;
  corPrimaria: string;
  corSecundaria: string;
  emailSuporte: string;
  whatsappSuporte: string;
}
```

### 7.7 Tipos de Alerta

```typescript
// Tipos de alerta
type AlertaTipo = 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO' | 'INFO';
type AlertaStatus = 'PENDENTE' | 'LIDO' | 'RESPONDIDO' | 'RESOLVIDO' | 'ESCALADO';

interface Alerta {
  id: number;
  tipo: AlertaTipo;
  titulo: string;
  descricao: string;
  status: AlertaStatus;
  criadoEm: string;
  atualizadoEm?: string;
  lido: boolean;
  respondidoEm?: string;
  resolvidoEm?: string;
  respostas?: AlertaResposta[];
}

interface AlertaResposta {
  id: number;
  alertaId: number;
  usuarioId: number;
  usuarioNome: string;
  texto: string;
  criadoEm: string;
}
```

---

## 8. Sistema de Autenticacao

### 8.1 AuthContext

```typescript
// src/contexts/AuthContext.tsx

interface AuthContextType extends AuthState {
  login(email: string, password: string): Promise<void>;
  logout(): void;
  register(email: string, password: string, name: string): Promise<void>;
  hasPermission(permission: keyof Permission): boolean;
  isAdmin(): boolean;
}
```

### 8.2 Permissoes por Role

| Role | Dashboard Op | Dashboard Gestao | Cadastro GR | TV Display | Auditoria | Gerenciar Users | Aprovar | Deletar |
|------|-------------|------------------|-------------|------------|-----------|-----------------|---------|---------|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| gestor | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| operacional | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| cadastro | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| comercial | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

### 8.3 Armazenamento Local

```typescript
// Chaves no localStorage
localStorage.setItem('authToken', token);     // Token JWT
localStorage.setItem('user', JSON.stringify(user));  // Dados do usuario

// Recuperacao
const token = localStorage.getItem('authToken');
const user = JSON.parse(localStorage.getItem('user') || 'null');

// Logout
localStorage.removeItem('authToken');
localStorage.removeItem('user');
```

### 8.4 Interceptor Axios

```typescript
// src/services/api.ts

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
});

// Request interceptor - adiciona token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - trata 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 9. Endpoints do Backend

### 9.1 Autenticacao

```
POST /api/auth/login
  Body: {
    email: string;
    password: string;
  }
  Response: {
    success: boolean;
    data: {
      token: string;
      user: User;
    }
  }

GET /api/auth/me
  Headers: Authorization: Bearer {token}
  Response: {
    success: boolean;
    data: User;
  }

POST /api/auth/logout
  Headers: Authorization: Bearer {token}
  Response: {
    success: boolean;
  }
```

### 9.2 Fila de Cadastro

```
GET /api/fila
  Query: {
    status?: 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'REJEITADO';
    tipo?: 'MOTORISTA' | 'VEICULO';
    prioridade?: 'NORMAL' | 'ALTA' | 'URGENTE';
    page?: number;
    limit?: number;
  }
  Response: {
    success: boolean;
    data: Submission[];
    total: number;
  }

GET /api/fila/:id
  Response: {
    success: boolean;
    data: Submission;
  }

POST /api/fila
  Body: {
    documentos: DocumentFile[];
    prioridade?: 'normal' | 'alta' | 'urgente';
  }
  Response: {
    success: boolean;
    data: Submission;
  }

POST /api/fila/:id/aprovar
  Body: {
    observacoes?: string;
  }
  Response: {
    success: boolean;
    data: Submission;
  }

POST /api/fila/:id/rejeitar
  Body: {
    motivo: string;
  }
  Response: {
    success: boolean;
    data: Submission;
  }

POST /api/fila/:id/analisar
  Body: {
    atribuido_a?: number;
  }
  Response: {
    success: boolean;
    data: Submission;
  }

POST /api/fila/:id/comentar
  Body: {
    texto: string;
  }
  Response: {
    success: boolean;
    data: Submission;
  }

GET /api/fila/stats
  Response: {
    success: boolean;
    data: {
      pendentes: number;
      emAnalise: number;
      aprovados: number;
      rejeitados: number;
      total: number;
    }
  }
```

### 9.3 Alertas

```
GET /api/alertas
  Query: {
    status?: AlertaStatus;
    tipo?: AlertaTipo;
    page?: number;
    limit?: number;
  }
  Response: {
    success: boolean;
    data: Alerta[];
    total: number;
  }

GET /api/alertas/:id
  Response: {
    success: boolean;
    data: Alerta;
  }

POST /api/alertas/:id/marcar-lido
  Response: {
    success: boolean;
    data: Alerta;
  }

POST /api/alertas/:id/responder
  Body: {
    resposta: string;
  }
  Response: {
    success: boolean;
    data: Alerta;
  }

POST /api/alertas/:id/escalar
  Body: {
    para_usuario_id: number;
    motivo: string;
  }
  Response: {
    success: boolean;
    data: Alerta;
  }

POST /api/alertas/:id/resolver
  Response: {
    success: boolean;
    data: Alerta;
  }
```

### 9.4 Coletas

```
GET /api/coletas
  Query: {
    status?: string;
    page?: number;
    limit?: number;
  }
  Response: {
    success: boolean;
    data: Coleta[];
    total: number;
  }

GET /api/coletas/:id
  Response: {
    success: boolean;
    data: Coleta;
  }

GET /api/coletas/resumo
  Response: {
    success: boolean;
    data: {
      total: number;
      pendentes: number;
      emAndamento: number;
      concluidas: number;
    }
  }
```

### 9.5 Usuarios

```
GET /api/usuarios
  Query: {
    role?: UserRole;
    ativo?: boolean;
    page?: number;
    limit?: number;
  }
  Response: {
    success: boolean;
    data: User[];
    total: number;
  }

GET /api/usuarios/:id
  Response: {
    success: boolean;
    data: User;
  }

POST /api/usuarios
  Body: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    departamento: string;
  }
  Response: {
    success: boolean;
    data: User;
  }

PUT /api/usuarios/:id
  Body: Partial<User>
  Response: {
    success: boolean;
    data: User;
  }

DELETE /api/usuarios/:id
  Response: {
    success: boolean;
  }
```

### 9.6 Dashboard e Estatisticas

```
GET /api/dashboard/stats
  Response: {
    success: boolean;
    data: {
      cadastros: {
        pendentes: number;
        aprovados: number;
        rejeitados: number;
      };
      coletas: {
        total: number;
        emAndamento: number;
      };
      alertas: {
        criticos: number;
        pendentes: number;
      };
      usuarios: {
        ativos: number;
        total: number;
      };
    }
  }

GET /api/dashboard/kpis
  Query: {
    periodo?: 'dia' | 'semana' | 'mes' | 'ano';
  }
  Response: {
    success: boolean;
    data: {
      receita: number;
      receitaVariacao: number;
      entregas: number;
      entregasVariacao: number;
      eficiencia: number;
      eficienciaVariacao: number;
      custos: number;
      custosVariacao: number;
    }
  }

GET /api/dashboard/rotas
  Response: {
    success: boolean;
    data: {
      origem: string;
      destino: string;
      viagens: number;
    }[];
  }
```

### 9.7 Auditoria

```
GET /api/auditoria
  Query: {
    tipo?: LogTipo;
    modulo?: string;
    usuarioId?: string;
    dataInicio?: string;
    dataFim?: string;
    page?: number;
    limit?: number;
  }
  Response: {
    success: boolean;
    data: LogAuditoria[];
    total: number;
  }

GET /api/auditoria/export
  Query: {
    formato: 'csv' | 'xlsx' | 'pdf';
    // ... mesmos filtros de GET /api/auditoria
  }
  Response: Binary file
```

### 9.8 Upload de Documentos

```
POST /api/upload
  Content-Type: multipart/form-data
  Body: {
    file: File;
    tipo: string; // crlv, antt, cnh, etc
    customDescription?: string;
  }
  Response: {
    success: boolean;
    data: {
      id: string;
      filename: string;
      url: string;
      type: string;
    }
  }

GET /api/upload/:id
  Response: Binary file (download)

DELETE /api/upload/:id
  Response: {
    success: boolean;
  }
```

### 9.9 Configuracoes

```
GET /api/configuracoes/usuario
  Response: {
    success: boolean;
    data: ConfiguracaoUsuario;
  }

PUT /api/configuracoes/usuario
  Body: ConfiguracaoUsuario
  Response: {
    success: boolean;
    data: ConfiguracaoUsuario;
  }

GET /api/configuracoes/sistema
  Response: {
    success: boolean;
    data: ConfiguracaoSistema;
  }

PUT /api/configuracoes/sistema
  Body: ConfiguracaoSistema
  Response: {
    success: boolean;
    data: ConfiguracaoSistema;
  }
```

---

## 10. Integracoes

### 10.1 SSW-HELPER (Middleware ERP)

O SSW-HELPER e um middleware que conecta o BBT Connect ao ERP SSW da transportadora.

```
Base URL: http://localhost:3000 (VITE_SSW_HELPER_URL)

GET /api/auth/status
  Response: {
    authenticated: boolean;
    user?: string;
    sessionExpiry?: string;
  }

POST /api/auth/login-auto
  Response: {
    success: boolean;
    error?: string;
  }

GET /api/drivers/:cpf
  Response: {
    success: boolean;
    data?: DriverData;
    error?: string;
    timestamp?: string;
  }
```

### 10.2 WebSocket (Tempo Real)

```typescript
// Eventos emitidos pelo servidor
socket.on('fila:nova', (submission: Submission) => void);
socket.on('fila:atualizada', (submission: Submission) => void);
socket.on('alerta:novo', (alerta: Alerta) => void);
socket.on('stats:updated', (stats: DashboardStats) => void);

// Eventos emitidos pelo cliente
socket.emit('subscribe', { room: 'fila' });
socket.emit('subscribe', { room: 'alertas' });
socket.emit('unsubscribe', { room: string });
```

---

## 11. Validacoes

### 11.1 Validacoes de Campo

```typescript
// src/utils/validators.ts

// Email
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Telefone brasileiro
function isValidPhone(phone: string): boolean {
  return /^\(?[1-9]{2}\)?(?:9)?[6-9]\d{3}-?\d{4}$/.test(phone);
}

// CPF com validacao de digitos
function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false; // Rejeita 111.111.111-11

  // Calculo dos digitos verificadores
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cleaned[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleaned[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cleaned[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cleaned[10]);
}

// URL
function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

### 11.2 Validacoes de Documentos

```typescript
// Documentos obrigatorios para cadastro
const DOCUMENTOS_OBRIGATORIOS = [
  'crlv',      // CRLV's (Cavalo e Carreta)
  'antt',      // ANTT do veiculo
  'cnh',       // CNH do motorista
  'endereco',  // Comprovante de endereco
  'bancario',  // Dados bancarios
  'pamcard',   // PAMCARD/TAG
  'gr',        // Gerenciadora de Risco
  'rcv',       // Certificado RCV
];

// Tipos de arquivo aceitos
const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Tamanho maximo por arquivo
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

---

## 12. Configuracoes

### 12.1 Variaveis de Ambiente

```env
# .env

# API Configuration
VITE_API_URL=http://localhost:3001/api

# SSW-HELPER API (Middleware)
VITE_SSW_HELPER_URL=http://localhost:3000

# Application
VITE_APP_NAME=BBT Connect
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_MOCK_API=true
```

### 12.2 Vite Config

```typescript
// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

### 12.3 Tailwind Config (Tema BBT)

```javascript
// tailwind.config.js

module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        benfica: {
          red: '#ED1C24',      // Vermelho Benfica (alertas, CTAs)
          blue: '#0072BC',     // Azul Benfica (primario)
          silver: '#B1B3B6',   // Prata
          dark: '#020617',     // Slate-950 (fundo escuro)
        },
        midnight: {
          base: '#0F172A',     // Superficie base
          elevated: '#1E293B', // Cards
          hover: '#334155',    // Hover
        },
        neon: {
          turquoise: '#22D3EE', // Acao secundaria
        },
      },
    },
  },
};
```

### 12.4 TypeScript Config

```json
// tsconfig.app.json

{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

---

## 13. Deploy

### 13.1 Dockerfile

```dockerfile
# packages/frontend/Dockerfile

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 13.2 Nginx Config

```nginx
# packages/frontend/nginx.conf

server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para API
    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache de assets estaticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### 13.3 Docker Compose (Exemplo)

```yaml
# docker-compose.yml

version: '3.8'

services:
  frontend:
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=/api

  backend:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/bbtconnect
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=bbtconnect
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Apendice A: Credenciais de Teste

```
Senha padrao: bbt123

Usuarios de teste:
- thaylor@bbttransportes.com.br (Admin)
- jordana@bbttransportes.com.br (Cadastro/GR)
- miqueias@bbttransportes.com.br (Operacional)
```

---

## Apendice B: Checklist de Documentos

| # | Tipo | Codigo | Obrigatorio |
|---|------|--------|-------------|
| 1 | CRLV's (Cavalo e Carreta) | crlv | Sim |
| 2 | ANTT (Veiculo) | antt | Sim |
| 3 | CNH (Motorista) | cnh | Sim |
| 4 | Comprovante de Endereco | endereco | Sim |
| 5 | Dados Bancarios | bancario | Sim |
| 6 | PAMCARD/TAG | pamcard | Sim |
| 7 | GR (Gerenciadora de Risco) | gr | Sim |
| 8 | RCV (Certificado) | rcv | Sim |
| 9 | Doc. Proprietario (ANTT PF) | doc_proprietario | Nao |
| 10 | Endereco Proprietario | end_proprietario | Nao |
| 11 | Outros | outros | Nao |

---

## Apendice C: Codigos de Erro

| Codigo | Mensagem | Descricao |
|--------|----------|-----------|
| 400 | Bad Request | Requisicao mal formada |
| 401 | Unauthorized | Token invalido ou expirado |
| 403 | Forbidden | Sem permissao para o recurso |
| 404 | Not Found | Recurso nao encontrado |
| 409 | Conflict | Conflito (ex: email ja existe) |
| 422 | Unprocessable Entity | Dados invalidos |
| 500 | Internal Server Error | Erro interno do servidor |

---

**Documento gerado em:** Janeiro 2026
**Versao:** 1.0.0
**Autor:** Claude AI (Assistente de Desenvolvimento)
