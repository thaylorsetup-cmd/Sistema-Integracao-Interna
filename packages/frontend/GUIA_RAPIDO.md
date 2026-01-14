# Guia Rápido - Frontend Guardião V2

## Começar a Desenvolver

### 1. Instalar Dependências
```bash
cd packages/frontend
pnpm install
```

### 2. Iniciar Servidor de Desenvolvimento
```bash
pnpm dev
```

Acesse em: http://localhost:5173

### 3. Scripts Úteis
```bash
pnpm build          # Build para produção
pnpm preview        # Preview do build
pnpm lint           # Verificar código
pnpm typecheck      # Type checking
```

## Estrutura de Pastas

```
src/
├── components/        # Componentes React
├── contexts/         # Contextos (Auth, Theme, etc)
├── hooks/            # Custom hooks
├── pages/            # Páginas/rotas
├── services/         # Serviços (API, etc)
├── types/            # Tipos TypeScript globais
├── utils/            # Funções utilitárias
├── App.tsx           # Componente principal
├── main.tsx          # Ponto de entrada
└── index.css         # Estilos globais
```

## Exemplos de Uso

### Criar um Novo Componente

**1. Arquivo do componente** (`src/components/ui/Button.tsx`)
```tsx
import { cn } from '@/utils';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  [key: string]: any;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'font-semibold rounded transition-colors',
        variant === 'primary' && 'bg-primary text-white hover:bg-blue-600',
        variant === 'secondary' && 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        size === 'sm' && 'px-3 py-1 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

**2. Exportar em** `src/components/ui/index.ts`
```tsx
export { Button } from './Button';
```

**3. Usar o componente**
```tsx
import { Button } from '@/components/ui';

export function MyPage() {
  return (
    <div>
      <Button variant="primary" size="lg">
        Clique em mim
      </Button>
    </div>
  );
}
```

### Usar o Contexto de Autenticação

```tsx
import { useAuth } from '@/hooks';

export function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div>
      <p>Bem-vindo, {user.name}!</p>
      <button onClick={logout}>Sair</button>
    </div>
  );
}
```

### Fazer Requisição à API

```tsx
import { apiClient } from '@/services';
import { useApi } from '@/hooks';

export function UsersList() {
  const { data, loading, error, execute } = useApi();

  const fetchUsers = async () => {
    await execute(apiClient.get('/users'));
  };

  return (
    <div>
      <button onClick={fetchUsers}>Carregar usuários</button>
      {loading && <p>Carregando...</p>}
      {error && <p>Erro: {error.message}</p>}
      {data && (
        <ul>
          {data.items?.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Validação com Zod e React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    console.log('Form data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} placeholder="Email" />
      {errors.email && <p>{errors.email.message}</p>}

      <input {...register('password')} type="password" placeholder="Senha" />
      {errors.password && <p>{errors.password.message}</p>}

      <button type="submit">Login</button>
    </form>
  );
}
```

### Usar Utilitários

```tsx
import {
  cn,
  formatDate,
  formatCurrency,
  formatPercent,
  isValidEmail,
} from '@/utils';

// Classes
const classes = cn('px-2 py-1', 'px-4'); // "py-1 px-4"

// Formatação de data
formatDate(new Date()); // "25/12/2025"

// Formatação de moeda
formatCurrency(1500); // "R$ 1.500,00"

// Formatação de percentual
formatPercent(0.85); // "85%"

// Validação
isValidEmail('test@example.com'); // true
```

### Usar TanStack Query

```tsx
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services';

export function Dashboard() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/users'),
  });

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar dados</div>;

  return (
    <div>
      {users?.data?.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### Configurar Variáveis de Ambiente

**1. Criar arquivo** `.env.local` (cópia de `.env.example`)
```bash
cp .env.example .env.local
```

**2. Configurar valores**
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Guardião V2
VITE_ENABLE_ANALYTICS=false
```

**3. Usar no código**
```tsx
const apiUrl = import.meta.env.VITE_API_URL;
```

## Tailwind CSS

### Cores Disponíveis

```tsx
// Cores da paleta
<div className="bg-primary text-white">Primária (azul BBT)</div>
<div className="bg-secondary">Secundária</div>
<div className="bg-success">Sucesso</div>
<div className="bg-danger">Perigo</div>
<div className="bg-warning">Aviso</div>
<div className="bg-info">Informação</div>
<div className="bg-light">Claro</div>
<div className="bg-dark">Escuro</div>
```

### Classes Comuns

```tsx
// Layout
<div className="flex items-center justify-between">...</div>
<div className="grid grid-cols-3 gap-4">...</div>

// Spacing
<div className="p-4 m-2">...</div>
<div className="px-4 py-2">...</div>

// Typography
<h1 className="text-2xl font-bold">Título</h1>
<p className="text-gray-600">Parágrafo</p>

// Borders
<div className="border border-gray-200 rounded">...</div>

// Efeitos
<div className="shadow hover:shadow-lg transition">...</div>
```

## TypeScript

### Tipos Globais

```tsx
// Importar tipos globais
import { User, AuthState, ApiResponse } from '@/types';

interface MyCustomType extends User {
  customField: string;
}

const response: ApiResponse<User[]> = {
  success: true,
  data: [],
};
```

### Path Aliases

```tsx
// Em vez de
import { Button } from '../../../components/ui/Button';

// Use
import { Button } from '@/components/ui';

// Para pacotes workspace
import { SharedTypes } from '@guardiao/shared';
```

## Dicas de Desenvolvimento

1. **Use o ESLint**: `pnpm lint` para verificar erros
2. **Type checking**: `pnpm typecheck` antes de fazer commit
3. **Hot Module Reload**: Vite atualiza automaticamente ao salvar
4. **DevTools React**: Instale a extensão do React DevTools
5. **TypeScript IntelliSense**: Use VSCode para melhor experiência

## Próximas Implementações

1. [ ] Implementar componentes UI base
2. [ ] Criar páginas (Login, Dashboard, etc)
3. [ ] Integrar Socket.io para real-time
4. [ ] Adicionar testes unitários
5. [ ] Adicionar testes E2E
6. [ ] Configurar CI/CD

## Referências

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React Router](https://reactrouter.com)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)

---

**Estrutura pronta para desenvolvimento!**
