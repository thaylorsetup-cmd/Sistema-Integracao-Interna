# Layout da Aplicação - Guardião V2

## Estrutura Criada

### Componentes de Layout

Criados em `src/components/layout/`:

1. **Header.tsx** - Cabeçalho da aplicação
   - Logo BBT Transportes com placeholder
   - Avatar e nome do usuário logado
   - Notificações com badge de contador (placeholder: 3)
   - Menu dropdown do usuário (Perfil, Configurações, Sair)
   - Fundo azul BBT (#0d6efd)
   - Totalmente responsivo

2. **Sidebar.tsx** - Barra lateral de navegação
   - Links de navegação:
     - Dashboard Operador
     - Dashboard Gestão
     - TV Display
     - Auditoria
     - Configurações
   - Ícones Lucide React
   - Item ativo destacado
   - Responsivo com menu mobile (botão flutuante)
   - Overlay em mobile
   - Footer com versão

3. **Container.tsx** - Container responsivo
   - Max-width configurável (sm, md, lg, xl, 2xl, full)
   - Padding adequado para diferentes breakpoints
   - Padrão: max-width 2xl

4. **MainLayout.tsx** - Layout principal
   - Combina Header + Sidebar + children
   - Estrutura flex para sidebar e conteúdo principal
   - Fundo cinza claro (#f9fafb)

### Páginas

#### Dashboard (`src/pages/dashboard/`)

1. **DashboardOperador.tsx**
   - Cards com métricas operacionais (placeholder)
   - Seção de atividades recentes
   - Layout responsivo em grid

2. **DashboardGestao.tsx**
   - Cards com métricas gerenciais (placeholder)
   - Análise de performance
   - Principais rotas
   - Layout responsivo em grid

3. **TvDisplay.tsx**
   - Modo full-screen (sem layout)
   - Fundo escuro para TV
   - Métricas em tempo real grandes
   - Mapa de rastreamento (placeholder)

#### Autenticação (`src/pages/auth/`)

1. **Login.tsx**
   - Formulário de login
   - Logo BBT Transportes
   - Validação de campos
   - Feedback de erro
   - Link "Esqueceu a senha"
   - Design gradiente azul

### Rotas Configuradas

Em `src/App.tsx`:

```typescript
- / → Redireciona para /dashboard/operador
- /login → Página de login (sem layout)
- /dashboard/operador → Dashboard Operador (com layout)
- /dashboard/gestao → Dashboard Gestão (com layout)
- /tv-display → TV Display (sem layout, full-screen)
- /auditoria → Auditoria (com layout, placeholder)
- /configuracoes → Configurações (com layout, placeholder)
- * → Redireciona para /dashboard/operador
```

### Contextos

**useAuth Hook** criado em `src/contexts/useAuth.ts`:
- Hook customizado para acessar o AuthContext
- Valida se está sendo usado dentro do AuthProvider
- Fornece: user, token, login, logout, register

## Cores BBT Transportes

- Azul Principal: `#0d6efd`
- Azul Hover: `#0b5ed7`
- Azul Claro: `#cfe2ff`
- Background: `#f9fafb`

## Ícones Lucide React Utilizados

- Bell (Notificações)
- ChevronDown (Dropdown)
- User (Usuário)
- Settings (Configurações)
- LogOut (Sair)
- LayoutDashboard (Dashboard Operador)
- BarChart3 (Dashboard Gestão)
- Tv (TV Display)
- FileText (Auditoria)
- Menu/X (Menu Mobile)

## Responsividade

### Breakpoints Tailwind:
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

### Mobile:
- Sidebar colapsa e vira menu flutuante (botão no canto inferior direito)
- Header compacto (esconde nome em telas pequenas)
- Grid de cards adapta para 1 coluna

### Desktop:
- Sidebar fixa à esquerda
- Header completo com informações
- Grids responsivos (2-4 colunas)

## Próximos Passos

1. Implementar autenticação real com API
2. Adicionar gráficos com Recharts nos dashboards
3. Implementar sistema de notificações real
4. Criar páginas de Auditoria e Configurações
5. Adicionar mapa de rastreamento no TV Display
6. Implementar WebSocket para atualizações em tempo real
7. Adicionar testes unitários para componentes
8. Implementar proteção de rotas (PrivateRoute)

## Como Testar

```bash
cd packages/frontend
npm run dev
```

Acesse: `http://localhost:5173`

Rotas disponíveis:
- `/login` - Tela de login
- `/dashboard/operador` - Dashboard operacional
- `/dashboard/gestao` - Dashboard gerencial
- `/tv-display` - Display para TV
- `/auditoria` - Auditoria (placeholder)
- `/configuracoes` - Configurações (placeholder)
