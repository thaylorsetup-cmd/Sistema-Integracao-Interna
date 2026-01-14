/**
 * Mock WebSocket - Simula eventos em tempo real usando EventEmitter
 * Compatível com interface Socket.io
 *
 * IMPORTANTE: Substituir por Socket.io real quando backend estiver pronto
 */

import {
  adicionarItemFila,
  adicionarAlerta,
  updateFilaItem,
  getFilaCadastro,
  getStats,
  type FilaCadastro,
} from './mockDatabase';

// ============================================================================
// EVENT EMITTER SIMPLES
// ============================================================================

type EventCallback = (...args: any[]) => void;

class SimpleEventEmitter {
  private events: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

// ============================================================================
// MOCK WEBSOCKET CLIENT
// ============================================================================

export class MockWebSocket extends SimpleEventEmitter {
  private connected: boolean = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private eventCounter: number = 0;

  constructor() {
    super();
  }

  /**
   * Conectar ao WebSocket (simulado)
   */
  connect(): void {
    if (this.connected) {
      console.warn('[MockWebSocket] Já conectado');
      return;
    }

    console.log('[MockWebSocket] Conectando...');

    // Simular delay de conexão
    setTimeout(() => {
      this.connected = true;
      this.emit('connect');
      console.log('[MockWebSocket] Conectado');

      // Iniciar geração de eventos
      this.startEventGeneration();
    }, 500);
  }

  /**
   * Desconectar do WebSocket
   */
  disconnect(): void {
    if (!this.connected) {
      return;
    }

    console.log('[MockWebSocket] Desconectando...');
    this.connected = false;
    this.stopEventGeneration();
    this.emit('disconnect');
    console.log('[MockWebSocket] Desconectado');
  }

  /**
   * Verificar se está conectado
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Iniciar geração automática de eventos
   */
  private startEventGeneration(): void {
    if (this.intervalId) {
      return;
    }

    // Gerar eventos a cada 15-30 segundos
    const generateEvent = () => {
      if (!this.connected) {
        return;
      }

      const randomDelay = 15000 + Math.random() * 15000; // 15-30 segundos

      this.intervalId = setTimeout(() => {
        this.generateRandomEvent();
        generateEvent(); // Agendar próximo evento
      }, randomDelay);
    };

    generateEvent();
  }

  /**
   * Parar geração de eventos
   */
  private stopEventGeneration(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Gerar evento aleatório
   */
  private generateRandomEvent(): void {
    this.eventCounter++;
    const eventType = Math.random();

    if (eventType < 0.4) {
      // 40% - Nova tarefa na fila
      this.generateFilaNova();
    } else if (eventType < 0.7) {
      // 30% - Atualização de status na fila
      this.generateFilaAtualizada();
    } else if (eventType < 0.9) {
      // 20% - Novo alerta
      this.generateAlertaNovo();
    } else {
      // 10% - Atualização de estatísticas
      this.generateStatsUpdated();
    }
  }

  /**
   * Gerar evento: nova tarefa na fila
   */
  private generateFilaNova(): void {
    const tipos = ['MOTORISTA', 'DOCUMENTO', 'VEICULO', 'CLIENTE', 'FORNECEDOR'] as const;
    const prioridades = ['NORMAL', 'ALTA', 'URGENTE', 'CRITICA'] as const;

    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const prioridade = prioridades[Math.floor(Math.random() * prioridades.length)];

    const nomes = [
      'Carlos Alberto Souza',
      'Ana Paula Ferreira',
      'Roberto Santos Lima',
      'Mariana Costa Silva',
      'Pedro Henrique Alves',
    ];

    const novoItem = adicionarItemFila({
      tipo,
      entidade_id: `AUTO${Date.now()}`,
      entidade_nome: nomes[Math.floor(Math.random() * nomes.length)],
      status: 'PENDENTE',
      prioridade,
      descricao: `Item gerado automaticamente pelo sistema - ${tipo.toLowerCase()}`,
      documentos_anexos: [],
      comentarios: [],
      atribuido_a: null,
      solicitado_por: 3, // Wilton
      departamento_origem: 'OPERACAO',
      departamento_destino: 'CADASTRO',
      iniciado_em: null,
      finalizado_em: null,
      prazo_limite: null,
      motivo_rejeicao: null,
      observacoes: null,
    });

    console.log('[MockWebSocket] Evento: fila:nova', novoItem);
    this.emit('fila:nova', novoItem);

    // Também emitir atualização de stats
    this.generateStatsUpdated();
  }

  /**
   * Gerar evento: atualização na fila
   */
  private generateFilaAtualizada(): void {
    const itens = getFilaCadastro({ status: ['PENDENTE', 'EM_ANALISE'] });

    if (itens.length === 0) {
      return;
    }

    const item = itens[Math.floor(Math.random() * itens.length)];
    const novosStatus = ['EM_ANALISE', 'APROVADO', 'REJEITADO'] as const;
    const novoStatus = novosStatus[Math.floor(Math.random() * novosStatus.length)];

    const updates: Partial<FilaCadastro> = {
      status: novoStatus,
    };

    if (novoStatus === 'EM_ANALISE') {
      updates.iniciado_em = new Date().toISOString();
      updates.atribuido_a = 1; // Jordana
    } else if (novoStatus === 'APROVADO' || novoStatus === 'REJEITADO') {
      updates.finalizado_em = new Date().toISOString();
      if (novoStatus === 'REJEITADO') {
        updates.motivo_rejeicao = 'Documentação incompleta ou divergente';
      }
    }

    const itemAtualizado = updateFilaItem(item.id, updates);

    if (itemAtualizado) {
      console.log('[MockWebSocket] Evento: fila:atualizada', itemAtualizado);
      this.emit('fila:atualizada', itemAtualizado);

      // Também emitir atualização de stats
      this.generateStatsUpdated();
    }
  }

  /**
   * Gerar evento: novo alerta
   */
  private generateAlertaNovo(): void {
    const tipos = ['CRITICO', 'ALTO', 'MEDIO', 'BAIXO', 'INFORMATIVO'] as const;
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];

    const mensagens = {
      CRITICO: [
        'Motorista com documentação vencida há mais de 30 dias',
        'Possível duplicidade detectada no sistema',
        'Veículo com CRLV vencido operando',
      ],
      ALTO: [
        'Documento vence em menos de 7 dias',
        'Coleta sem motorista designado há 2 horas',
        'Cliente aguardando aprovação urgente',
      ],
      MEDIO: [
        'Atualização cadastral pendente',
        'Revisão de documentos necessária',
        'Verificar dados do motorista',
      ],
      BAIXO: [
        'Lembrete: renovação próxima',
        'Documentação a vencer em 30 dias',
      ],
      INFORMATIVO: [
        'Novo motorista cadastrado com sucesso',
        'Sistema atualizado',
        'Backup realizado',
      ],
    };

    const mensagensTipo = mensagens[tipo];
    const mensagem = mensagensTipo[Math.floor(Math.random() * mensagensTipo.length)];

    const novoAlerta = adicionarAlerta({
      tipo,
      titulo: `Alerta ${tipo}`,
      mensagem,
      entidade_tipo: 'SISTEMA',
      entidade_id: null,
      status: 'PENDENTE',
      destinatario_id: 1, // Jordana
      resposta: null,
      respondido_por: null,
      respondido_em: null,
      escalado_para: null,
      escalado_em: null,
      motivo_escalacao: null,
      whatsapp_message_id: null,
      whatsapp_enviado: false,
      whatsapp_lido: false,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hora
      acoes_disponiveis: [],
    });

    console.log('[MockWebSocket] Evento: alerta:novo', novoAlerta);
    this.emit('alerta:novo', novoAlerta);
  }

  /**
   * Gerar evento: atualização de estatísticas
   */
  private generateStatsUpdated(): void {
    const stats = getStats();

    console.log('[MockWebSocket] Evento: stats:updated', stats);
    this.emit('stats:updated', stats);
  }

  /**
   * Emitir evento manualmente (para testes)
   */
  emitEvent(event: string, data: any): void {
    if (!this.connected) {
      console.warn('[MockWebSocket] Não conectado - evento ignorado');
      return;
    }

    console.log(`[MockWebSocket] Evento manual: ${event}`, data);
    this.emit(event, data);
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

let mockWebSocketInstance: MockWebSocket | null = null;

/**
 * Obter instância singleton do MockWebSocket
 */
export function getMockWebSocket(): MockWebSocket {
  if (!mockWebSocketInstance) {
    mockWebSocketInstance = new MockWebSocket();
  }
  return mockWebSocketInstance;
}

/**
 * Criar nova instância (útil para testes)
 */
export function createMockWebSocket(): MockWebSocket {
  return new MockWebSocket();
}

// ============================================================================
// HOOK PARA REACT (OPCIONAL)
// ============================================================================

/**
 * Hook para usar MockWebSocket em componentes React
 *
 * Uso:
 * ```tsx
 * const ws = useMockWebSocket();
 *
 * useEffect(() => {
 *   ws.on('fila:nova', (item) => {
 *     console.log('Nova tarefa:', item);
 *   });
 *
 *   return () => {
 *     ws.off('fila:nova', handler);
 *   };
 * }, [ws]);
 * ```
 */
export function useMockWebSocket(): MockWebSocket {
  return getMockWebSocket();
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default getMockWebSocket();
