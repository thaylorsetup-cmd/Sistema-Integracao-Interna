# Sistema de Mock API - Guardião V2

Sistema de mock API inteligente que simula backend real com dados em memória baseados no PostgreSQL.

## Arquivos

- **mockDatabase.ts** - Banco de dados em memória com dados dos seeds
- **mockApi.ts** - API simulada com delays realistas
- **mockWebSocket.ts** - WebSocket simulado com eventos em tempo real

## Como Usar

### 1. API Mock (Chamadas HTTP simuladas)

```typescript
import { mockApi } from '@/services';

// Login
const loginResult = await mockApi.auth.login('jordana@bbttransportes.com.br', 'qualquer-senha');
console.log(loginResult.data); // { token, user }

// Listar fila de cadastro
const filaResult = await mockApi.fila.list({
  status: ['PENDENTE', 'EM_ANALISE'],
  prioridade: ['ALTA', 'URGENTE'],
});
console.log(filaResult.data); // Array de itens

// Aprovar item
const aprovarResult = await mockApi.fila.aprovar(1, 'Documentação OK');
console.log(aprovarResult.data); // Item atualizado

// Rejeitar item
const rejeitarResult = await mockApi.fila.rejeitar(2, 'CPF divergente');

// Adicionar comentário
const comentarioResult = await mockApi.fila.comentar(3, 'Aguardando retorno do motorista', 'Jordana');

// Listar alertas
const alertasResult = await mockApi.alertas.list({
  status: ['PENDENTE'],
  tipo: ['CRITICO', 'ALTO'],
});

// Marcar alerta como lido
await mockApi.alertas.marcarLido(1);

// Obter estatísticas
const statsResult = await mockApi.dashboard.stats();
console.log(statsResult.data); // { fila, alertas, coletas }
```

### 2. WebSocket Mock (Eventos em Tempo Real)

```typescript
import { getMockWebSocket } from '@/services';

// Obter instância singleton
const ws = getMockWebSocket();

// Conectar
ws.connect();

// Escutar eventos
ws.on('connect', () => {
  console.log('WebSocket conectado!');
});

ws.on('fila:nova', (item) => {
  console.log('Nova tarefa na fila:', item);
  // Atualizar UI
});

ws.on('fila:atualizada', (item) => {
  console.log('Tarefa atualizada:', item);
  // Atualizar UI
});

ws.on('alerta:novo', (alerta) => {
  console.log('Novo alerta:', alerta);
  // Mostrar notificação
});

ws.on('stats:updated', (stats) => {
  console.log('Estatísticas atualizadas:', stats);
  // Atualizar dashboard
});

// Desconectar
ws.disconnect();

// Remover listeners
ws.off('fila:nova', handler);
```

### 3. Uso com React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/services';

// Query para listar fila
function useFilaCadastro(filtros) {
  return useQuery({
    queryKey: ['fila', filtros],
    queryFn: async () => {
      const result = await mockApi.fila.list(filtros);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}

// Mutation para aprovar item
function useAprovarItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, observacoes }) => {
      const result = await mockApi.fila.aprovar(id, observacoes);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      // Invalidar queries para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['fila'] });
    },
  });
}

// Uso no componente
function FilaComponent() {
  const { data: itens, isLoading } = useFilaCadastro({ status: ['PENDENTE'] });
  const { mutate: aprovar } = useAprovarItem();

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      {itens?.map(item => (
        <div key={item.id}>
          <h3>{item.entidade_nome}</h3>
          <button onClick={() => aprovar({ id: item.id, observacoes: 'OK' })}>
            Aprovar
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 4. Integração com WebSocket em React

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getMockWebSocket } from '@/services';

function useRealtimeUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = getMockWebSocket();
    ws.connect();

    // Atualizar fila quando houver mudanças
    const handleFilaNova = (item) => {
      queryClient.setQueryData(['fila'], (old) => {
        return old ? [item, ...old] : [item];
      });
    };

    const handleFilaAtualizada = (item) => {
      queryClient.invalidateQueries({ queryKey: ['fila'] });
    };

    const handleAlertaNovo = (alerta) => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      // Mostrar toast notification
    };

    const handleStatsUpdated = (stats) => {
      queryClient.setQueryData(['stats'], stats);
    };

    ws.on('fila:nova', handleFilaNova);
    ws.on('fila:atualizada', handleFilaAtualizada);
    ws.on('alerta:novo', handleAlertaNovo);
    ws.on('stats:updated', handleStatsUpdated);

    return () => {
      ws.off('fila:nova', handleFilaNova);
      ws.off('fila:atualizada', handleFilaAtualizada);
      ws.off('alerta:novo', handleAlertaNovo);
      ws.off('stats:updated', handleStatsUpdated);
      ws.disconnect();
    };
  }, [queryClient]);
}

// Usar no App.tsx
function App() {
  useRealtimeUpdates();

  return <YourApp />;
}
```

## Eventos WebSocket Disponíveis

| Evento | Dados | Frequência | Descrição |
|--------|-------|------------|-----------|
| `connect` | - | Uma vez | Conexão estabelecida |
| `disconnect` | - | Uma vez | Conexão encerrada |
| `fila:nova` | `FilaCadastro` | 40% dos eventos | Nova tarefa adicionada |
| `fila:atualizada` | `FilaCadastro` | 30% dos eventos | Status de tarefa mudou |
| `alerta:novo` | `Alerta` | 20% dos eventos | Novo alerta criado |
| `stats:updated` | `Stats` | 10% dos eventos | Estatísticas atualizadas |

Os eventos são gerados automaticamente a cada 15-30 segundos após a conexão.

## API Endpoints Disponíveis

### Autenticação
- `mockApi.auth.login(email, password)` - Login
- `mockApi.auth.me()` - Usuário atual
- `mockApi.auth.logout()` - Logout

### Fila de Cadastro
- `mockApi.fila.list(filtros?)` - Listar itens
- `mockApi.fila.get(id)` - Obter item
- `mockApi.fila.aprovar(id, observacoes?)` - Aprovar
- `mockApi.fila.rejeitar(id, motivo)` - Rejeitar
- `mockApi.fila.analisar(id, atribuido_a?)` - Colocar em análise
- `mockApi.fila.comentar(id, texto, usuario?)` - Adicionar comentário
- `mockApi.fila.atribuir(id, usuario_id)` - Atribuir a usuário
- `mockApi.fila.stats()` - Estatísticas da fila

### Alertas
- `mockApi.alertas.list(filtros?)` - Listar alertas
- `mockApi.alertas.get(id)` - Obter alerta
- `mockApi.alertas.marcarLido(id)` - Marcar como lido
- `mockApi.alertas.responder(id, resposta, usuario_id)` - Responder
- `mockApi.alertas.escalar(id, para_usuario_id, motivo)` - Escalar
- `mockApi.alertas.resolver(id)` - Resolver

### Coletas
- `mockApi.coletas.list(filtros?)` - Listar coletas
- `mockApi.coletas.get(id)` - Obter coleta
- `mockApi.coletas.resumo()` - Resumo de coletas

### Usuários
- `mockApi.usuarios.list()` - Listar usuários
- `mockApi.usuarios.get(id)` - Obter usuário

### Dashboard
- `mockApi.dashboard.stats()` - Todas as estatísticas

## Formato de Resposta

Todas as APIs retornam o formato:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

Sucesso:
```json
{
  "success": true,
  "data": { ... }
}
```

Erro:
```json
{
  "success": false,
  "error": "Mensagem de erro"
}
```

## Delays Simulados

- Operações normais: 100-300ms (aleatório)
- Operações de escrita: 150-200ms
- Login: 100-300ms

## Migração para Backend Real

Quando o backend estiver pronto, substituir:

```typescript
// Antes (mock)
import { mockApi } from '@/services';
const result = await mockApi.fila.list();

// Depois (real)
import { apiClient } from '@/services';
const result = await apiClient.get('/api/fila');
```

Para WebSocket real (Socket.io):

```typescript
// Antes (mock)
import { getMockWebSocket } from '@/services';
const ws = getMockWebSocket();

// Depois (real)
import { io } from 'socket.io-client';
const ws = io('http://localhost:3001');
```

## Dados Iniciais

O sistema vem com dados de seed baseados no `init.sql`:

- **4 usuários**: Jordana (Operador), Gilclésio (Gestor), Wilton (Diretor), Thaylor (Admin)
- **4 itens na fila**: 2 motoristas, 1 documento, 1 veículo
- **3 alertas**: 1 crítico, 1 alto, 1 médio
- **4 coletas**: Diferentes status e rotas

## Funcionalidades Automáticas

1. **Cálculo de tempo de espera**: Atualizado dinamicamente
2. **Geração de UUID**: Para todos os registros
3. **Timestamps automáticos**: `created_at`, `updated_at`
4. **Eventos WebSocket**: Gerados automaticamente a cada 15-30s
5. **Validação de dados**: Tipos e status válidos
6. **Persistência em memória**: Dados sobrevivem durante sessão do navegador

## Limitações

- Dados em memória (perdidos ao recarregar página)
- Sem persistência em banco de dados
- Não conecta ao PostgreSQL real
- Login aceita qualquer senha
- Sem validação de permissões

## Próximos Passos

1. Implementar backend real em Node.js/Express
2. Conectar ao PostgreSQL usando `pg`
3. Implementar autenticação JWT real
4. Adicionar WebSocket real com Socket.io
5. Substituir chamadas mock por chamadas reais
