# Componentes UI Base - Sistema Guardião BBT

Biblioteca de componentes UI inspirados em shadcn/ui, construídos com React, TypeScript e Tailwind CSS.

## Componentes Disponíveis

### 1. Button
Botão com múltiplas variantes e suporte a ícones e loading state.

```tsx
import { Button } from '@/components/ui';
import { Plus } from 'lucide-react';

<Button variant="primary" size="md">
  Clique aqui
</Button>

<Button variant="success" leftIcon={<Plus className="h-4 w-4" />}>
  Adicionar
</Button>

<Button variant="danger" isLoading>
  Carregando...
</Button>
```

**Variantes:** `default`, `primary`, `secondary`, `success`, `danger`, `ghost`, `outline`
**Tamanhos:** `sm`, `md`, `lg`

### 2. Card
Componente de card com subcomponentes para estruturação.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
    <CardDescription>Descrição do card</CardDescription>
  </CardHeader>
  <CardContent>
    Conteúdo principal
  </CardContent>
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>
```

### 3. Badge
Badge para exibir tags e status.

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Ativo</Badge>
<Badge variant="danger">Inativo</Badge>
<Badge variant="warning">Pendente</Badge>
```

**Variantes:** `default`, `success`, `warning`, `danger`, `info`

### 4. Input
Campo de entrada com suporte a ícones, labels e estados de erro.

```tsx
import { Input } from '@/components/ui';
import { Search, Mail } from 'lucide-react';

<Input
  label="Email"
  type="email"
  placeholder="seu@email.com"
  leftIcon={<Mail className="h-4 w-4" />}
/>

<Input
  label="Buscar"
  placeholder="Pesquisar..."
  leftIcon={<Search className="h-4 w-4" />}
  error="Campo obrigatório"
/>
```

### 5. Textarea
Área de texto com contador de caracteres opcional.

```tsx
import { Textarea } from '@/components/ui';

<Textarea
  label="Descrição"
  placeholder="Digite aqui..."
  showCharCount
  maxLength={500}
/>
```

### 6. Select
Dropdown de seleção com suporte a customização.

```tsx
import { Select } from '@/components/ui';

const options = [
  { value: '1', label: 'Opção 1' },
  { value: '2', label: 'Opção 2' },
  { value: '3', label: 'Opção 3', disabled: true },
];

<Select
  label="Selecione"
  options={options}
  placeholder="Escolha uma opção"
  onChange={(value) => console.log(value)}
/>
```

### 7. Dialog
Modal dialog com overlay e animações.

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui';
import { Button } from '@/components/ui';

const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent onClose={() => setOpen(false)}>
    <DialogHeader>
      <DialogTitle>Confirmar ação</DialogTitle>
      <DialogDescription>
        Tem certeza que deseja continuar?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="ghost" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
      <Button variant="primary">
        Confirmar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 8. Toast
Sistema de notificações toast.

```tsx
import { ToastProvider, useToast } from '@/components/ui';

// No App.tsx, envolva com o provider
<ToastProvider>
  <App />
</ToastProvider>

// Em qualquer componente filho
const { addToast } = useToast();

addToast({
  title: 'Sucesso!',
  description: 'Operação realizada com sucesso',
  variant: 'success',
  duration: 5000
});
```

**Variantes:** `default`, `success`, `warning`, `danger`, `info`

### 9. Avatar
Avatar com fallback para iniciais e suporte a grupos.

```tsx
import { Avatar, AvatarGroup } from '@/components/ui';

<Avatar
  src="/avatar.jpg"
  alt="João Silva"
  fallback="João Silva"
  size="md"
/>

<AvatarGroup max={3} size="sm">
  <Avatar fallback="JS" />
  <Avatar fallback="MA" />
  <Avatar fallback="PF" />
  <Avatar fallback="RC" />
</AvatarGroup>
```

**Tamanhos:** `sm`, `md`, `lg`, `xl`

### 10. Separator
Divisor horizontal ou vertical.

```tsx
import { Separator } from '@/components/ui';

<div className="space-y-4">
  <div>Seção 1</div>
  <Separator />
  <div>Seção 2</div>
</div>

<div className="flex h-20 gap-4">
  <div>Coluna 1</div>
  <Separator orientation="vertical" />
  <div>Coluna 2</div>
</div>
```

### 11. Skeleton
Loading skeleton para estados de carregamento.

```tsx
import { Skeleton, SkeletonText, SkeletonCard } from '@/components/ui';

<Skeleton className="h-12 w-full" />
<Skeleton variant="circular" className="h-10 w-10" />
<SkeletonText lines={3} />
<SkeletonCard />
```

**Variantes:** `text`, `circular`, `rectangular`
**Animações:** `pulse`, `wave`, `none`

### 12. Progress
Barra de progresso linear e circular.

```tsx
import { Progress, ProgressCircular } from '@/components/ui';

<Progress
  value={60}
  max={100}
  variant="primary"
  showLabel
  label="Progresso"
/>

<ProgressCircular
  value={75}
  variant="success"
  size={120}
  strokeWidth={8}
/>
```

**Variantes:** `default`, `primary`, `success`, `warning`, `danger`

## Utilitários

### cn()
Função utilitária para combinar classes do Tailwind CSS.

```tsx
import { cn } from '@/utils/classnames';

<div className={cn(
  'base-class',
  isActive && 'active-class',
  className
)}>
  Conteúdo
</div>
```

## Tema

Todos os componentes utilizam as cores do tema BBT definidas no Tailwind:

- **primary:** `#0d6efd` (BBT Blue)
- **secondary:** `#6c757d`
- **success:** `#198754`
- **danger:** `#dc3545`
- **warning:** `#ffc107`
- **info:** `#0dcaf0`

## Acessibilidade

Todos os componentes foram desenvolvidos seguindo as diretrizes WAI-ARIA:

- Labels e descrições adequadas
- Suporte a navegação por teclado
- Estados ARIA para screen readers
- Focus visível e gerenciamento de foco
- Roles e propriedades ARIA apropriadas

## TypeScript

Todos os componentes possuem tipagem completa:

```tsx
import type { ButtonProps, InputProps, SelectOption } from '@/components/ui';
```
