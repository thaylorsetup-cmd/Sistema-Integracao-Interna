// @ts-nocheck
/**
 * Mock API - Simula endpoints de API usando dados do mockDatabase
 * Inclui delays realistas e formato de resposta padrão
 *
 * IMPORTANTE: Substituir por chamadas reais quando backend estiver pronto
 */

import {
  getUsuarios,
  getUsuarioById,
  getUsuarioByEmail,
  getFilaCadastro,
  getFilaById,
  updateFilaItem,
  adicionarComentario,
  getAlertas,
  getAlertaById,
  updateAlerta,
  getColetas,
  getColetaById,
  getStats,
  type FilaFiltros,
  type AlertaFiltros,
  type ColetaFiltros,
  type FilaCadastro,
  type Alerta,
} from './mockDatabase';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const MOCK_DELAY_MIN = 100; // ms
const MOCK_DELAY_MAX = 300; // ms

/**
 * Simula delay de rede para parecer real
 */
function delay(ms?: number): Promise<void> {
  const delayTime = ms ?? Math.random() * (MOCK_DELAY_MAX - MOCK_DELAY_MIN) + MOCK_DELAY_MIN;
  return new Promise(resolve => setTimeout(resolve, delayTime));
}

/**
 * Formato padrão de resposta da API
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Wrapper para simular resposta de API
 */
async function mockApiCall<T>(fn: () => T, delayMs?: number): Promise<ApiResponse<T>> {
  await delay(delayMs);

  try {
    const data = fn();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// ============================================================================
// API: AUTENTICAÇÃO
// ============================================================================

export const authApi = {
  /**
   * Login (mock - sempre retorna sucesso)
   */
  async login(email: string, _password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    await delay();

    const usuario = getUsuarioByEmail(email);

    if (!usuario) {
      return {
        success: false,
        error: 'Usuário não encontrado',
      };
    }

    // Mock: aceita qualquer senha
    const token = 'mock-jwt-token-' + Math.random().toString(36).substring(7);

    return {
      success: true,
      data: {
        token,
        user: {
          id: usuario.id,
          uuid: usuario.uuid,
          nome: usuario.nome,
          email: usuario.email,
          tipo: usuario.tipo,
          avatar_url: usuario.avatar_url,
        },
      },
    };
  },

  /**
   * Obter usuário autenticado
   */
  async me(): Promise<ApiResponse<any>> {
    await delay();

    // Mock: retorna sempre o primeiro usuário (Jordana)
    const usuario = getUsuarios()[0];

    return {
      success: true,
      data: {
        id: usuario.id,
        uuid: usuario.uuid,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        avatar_url: usuario.avatar_url,
      },
    };
  },

  /**
   * Logout
   */
  async logout(): Promise<ApiResponse<void>> {
    await delay(50);
    return { success: true };
  },
};

// ============================================================================
// API: FILA DE CADASTRO
// ============================================================================

export const filaApi = {
  /**
   * Lista itens da fila com filtros
   */
  async list(filtros?: FilaFiltros): Promise<ApiResponse<FilaCadastro[]>> {
    return mockApiCall(() => getFilaCadastro(filtros));
  },

  /**
   * Obtém item específico por ID
   */
  async get(id: number): Promise<ApiResponse<FilaCadastro>> {
    return mockApiCall(() => {
      const item = getFilaById(id);
      if (!item) {
        throw new Error('Item não encontrado');
      }
      return item;
    });
  },

  /**
   * Aprovar item da fila
   */
  async aprovar(id: number, observacoes?: string): Promise<ApiResponse<FilaCadastro>> {
    return mockApiCall(() => {
      const item = updateFilaItem(id, {
        status: 'APROVADO',
        finalizado_em: new Date().toISOString(),
        observacoes,
      });

      if (!item) {
        throw new Error('Item não encontrado');
      }

      return item;
    }, 200);
  },

  /**
   * Rejeitar item da fila
   */
  async rejeitar(id: number, motivo: string): Promise<ApiResponse<FilaCadastro>> {
    return mockApiCall(() => {
      const item = updateFilaItem(id, {
        status: 'REJEITADO',
        finalizado_em: new Date().toISOString(),
        motivo_rejeicao: motivo,
      });

      if (!item) {
        throw new Error('Item não encontrado');
      }

      return item;
    }, 200);
  },

  /**
   * Colocar em análise
   */
  async analisar(id: number, atribuido_a?: number): Promise<ApiResponse<FilaCadastro>> {
    return mockApiCall(() => {
      const item = updateFilaItem(id, {
        status: 'EM_ANALISE',
        iniciado_em: new Date().toISOString(),
        atribuido_a,
      });

      if (!item) {
        throw new Error('Item não encontrado');
      }

      return item;
    }, 150);
  },

  /**
   * Adicionar comentário
   */
  async comentar(id: number, texto: string, usuario: string = 'Usuário Mock'): Promise<ApiResponse<FilaCadastro>> {
    return mockApiCall(() => {
      const item = adicionarComentario(id, usuario, texto);

      if (!item) {
        throw new Error('Item não encontrado');
      }

      return item;
    }, 150);
  },

  /**
   * Atribuir a um usuário
   */
  async atribuir(id: number, usuario_id: number): Promise<ApiResponse<FilaCadastro>> {
    return mockApiCall(() => {
      const item = updateFilaItem(id, {
        atribuido_a: usuario_id,
      });

      if (!item) {
        throw new Error('Item não encontrado');
      }

      return item;
    }, 100);
  },

  /**
   * Obter estatísticas da fila
   */
  async stats(): Promise<ApiResponse<any>> {
    return mockApiCall(() => {
      const stats = getStats();
      return stats.fila;
    });
  },
};

// ============================================================================
// API: ALERTAS
// ============================================================================

export const alertasApi = {
  /**
   * Lista alertas com filtros
   */
  async list(filtros?: AlertaFiltros): Promise<ApiResponse<Alerta[]>> {
    return mockApiCall(() => getAlertas(filtros));
  },

  /**
   * Obtém alerta específico por ID
   */
  async get(id: number): Promise<ApiResponse<Alerta>> {
    return mockApiCall(() => {
      const alerta = getAlertaById(id);
      if (!alerta) {
        throw new Error('Alerta não encontrado');
      }
      return alerta;
    });
  },

  /**
   * Marcar como lido
   */
  async marcarLido(id: number): Promise<ApiResponse<Alerta>> {
    return mockApiCall(() => {
      const alerta = updateAlerta(id, {
        status: 'LIDO',
      });

      if (!alerta) {
        throw new Error('Alerta não encontrado');
      }

      return alerta;
    }, 100);
  },

  /**
   * Responder alerta
   */
  async responder(id: number, resposta: string, usuario_id: number): Promise<ApiResponse<Alerta>> {
    return mockApiCall(() => {
      const alerta = updateAlerta(id, {
        status: 'RESPONDIDO',
        resposta,
        respondido_por: usuario_id,
        respondido_em: new Date().toISOString(),
      });

      if (!alerta) {
        throw new Error('Alerta não encontrado');
      }

      return alerta;
    }, 200);
  },

  /**
   * Escalar alerta
   */
  async escalar(id: number, para_usuario_id: number, motivo: string): Promise<ApiResponse<Alerta>> {
    return mockApiCall(() => {
      const alerta = updateAlerta(id, {
        status: 'ESCALADO',
        escalado_para: para_usuario_id,
        escalado_em: new Date().toISOString(),
        motivo_escalacao: motivo,
      });

      if (!alerta) {
        throw new Error('Alerta não encontrado');
      }

      return alerta;
    }, 150);
  },

  /**
   * Resolver alerta
   */
  async resolver(id: number): Promise<ApiResponse<Alerta>> {
    return mockApiCall(() => {
      const alerta = updateAlerta(id, {
        status: 'RESOLVIDO',
      });

      if (!alerta) {
        throw new Error('Alerta não encontrado');
      }

      return alerta;
    }, 100);
  },
};

// ============================================================================
// API: COLETAS
// ============================================================================

export const coletasApi = {
  /**
   * Lista coletas com filtros
   */
  async list(filtros?: ColetaFiltros): Promise<ApiResponse<any[]>> {
    return mockApiCall(() => getColetas(filtros));
  },

  /**
   * Obtém coleta específica por ID
   */
  async get(id: number): Promise<ApiResponse<any>> {
    return mockApiCall(() => {
      const coleta = getColetaById(id);
      if (!coleta) {
        throw new Error('Coleta não encontrada');
      }
      return coleta;
    });
  },

  /**
   * Resumo de coletas
   */
  async resumo(): Promise<ApiResponse<any>> {
    return mockApiCall(() => {
      const stats = getStats();
      return stats.coletas;
    });
  },
};

// ============================================================================
// API: USUÁRIOS
// ============================================================================

export const usuariosApi = {
  /**
   * Lista todos os usuários
   */
  async list(): Promise<ApiResponse<any[]>> {
    return mockApiCall(() => getUsuarios());
  },

  /**
   * Obtém usuário por ID
   */
  async get(id: number): Promise<ApiResponse<any>> {
    return mockApiCall(() => {
      const usuario = getUsuarioById(id);
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }
      return usuario;
    });
  },
};

// ============================================================================
// API: DASHBOARD / ESTATÍSTICAS
// ============================================================================

export const dashboardApi = {
  /**
   * Obter todas as estatísticas
   */
  async stats(): Promise<ApiResponse<any>> {
    return mockApiCall(() => getStats());
  },
};

// ============================================================================
// EXPORT CONSOLIDADO
// ============================================================================

/**
 * API mock consolidada - compatível com axios
 */
export const mockApi = {
  auth: authApi,
  fila: filaApi,
  alertas: alertasApi,
  coletas: coletasApi,
  usuarios: usuariosApi,
  dashboard: dashboardApi,
};

export default mockApi;
