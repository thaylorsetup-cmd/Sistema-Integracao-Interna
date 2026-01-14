# Guardião V2 - Frontend

Frontend React + TypeScript + Vite para o projeto Guardião V2.

## Estrutura do Projeto

```
src/
├── components/         # Componentes React
│   ├── ui/            # Componentes base (Button, Card, Input, etc)
│   ├── layout/        # Componentes de layout (Header, Sidebar, Container)
│   └── dashboard/     # Componentes específicos do dashboard
├── contexts/          # Contextos do React
├── hooks/             # Hooks customizados
├── pages/             # Páginas da aplicação
├── services/          # Serviços de API (axios, requests)
├── types/             # Tipos TypeScript globais
├── utils/             # Funções utilitárias
├── App.tsx            # Componente principal
├── main.tsx           # Ponto de entrada
└── index.css          # Estilos globais (Tailwind)
```

## Tecnologias

- **React 18.2.0** - UI Library
- **TypeScript** - Type safety
- **Vite 7.2.4** - Build tool
- **React Router 6.21** - Roteamento
- **TanStack Query 5.17** - Gerenciamento de estado (server)
- **Socket.io 4.6.1** - Real-time communication
- **Axios 1.6.5** - HTTP Client
- **React Hook Form 7.49** - Form management
- **Zod 3.24** - Schema validation
- **Recharts 3.6** - Gráficos
- **Lucide React 0.312** - Ícones
- **Tailwind CSS 4.1** - Styling
- **date-fns 3.0** - Date utilities

## Instalação

```bash
cd packages/frontend

# Instalar dependências (já feito)
pnpm install
```

## Scripts

```bash
# Desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Preview do build
pnpm preview

# Lint
pnpm lint

# Type checking
pnpm typecheck
```

## Configuração

### Path Aliases

Aliases configurados em `tsconfig.app.json` e `vite.config.ts`:

- `@/*` -> `./src/*`
- `@guardiao/shared` -> `../../packages/shared`

### API Proxy

Dev server proxy configurado para `/api`:
- Request: `http://localhost:5173/api/users`
- Redirecionado para: `http://localhost:3001/users`

### Variáveis de Ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Configure a URL da API:

```
VITE_API_URL=http://localhost:3001/api
```

## Desenvolvimento

### Criar um novo componente

```bash
# Criar arquivo em src/components/ui/MyComponent.tsx
# Adicionar em src/components/ui/index.ts
export { MyComponent } from './MyComponent';
```

### Usar o contexto de autenticação

```tsx
import { useAuth } from '@/hooks';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  return <div>{user?.name}</div>;
}
```

### Fazer requisição à API

```tsx
import { apiClient } from '@/services';

const response = await apiClient.get('/users');
```

### Usar o hook customizado de API

```tsx
import { useApi } from '@/hooks';

function MyComponent() {
  const { data, loading, error, execute } = useApi();

  const handleFetch = async () => {
    await execute(apiClient.get('/users'));
  };

  return <button onClick={handleFetch}>Fetch</button>;
}
```

## Próximas etapas

- [ ] Implementar componentes UI base
- [ ] Criar páginas (Dashboard, Login, etc)
- [ ] Configurar rotas
- [ ] Implementar serviços de API
- [ ] Adicionar integração Socket.io
- [ ] Testes unitários e E2E
- [ ] CI/CD pipeline
