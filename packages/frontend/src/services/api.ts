import axios from 'axios';
import type { AxiosInstance, AxiosProgressEvent } from 'axios';

// Em produção com Traefik: usa /api (mesmo domínio)
// Em desenvolvimento: usa URL completa do backend
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocal ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') : '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante para enviar cookies de sessao
  timeout: 30000, // 30 segundos de timeout
});

// Interceptor para tratar respostas
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirecionar para login se nao autorizado
      // Nao limpar nada do localStorage pois usamos cookies
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// =====================================================
// TIPOS
// =====================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// =====================================================
// AUTH API
// =====================================================

export const authApi = {
  // Login simples com email e senha
  login: async (email: string, password: string) => {
    const response = await apiClient.post<ApiResponse>('/auth/login', { email, password });
    return response.data;
  },

  // Enviar codigo de verificacao por email (legado)
  sendCode: async (email: string) => {
    const response = await apiClient.post<ApiResponse>('/auth/send-code', { email });
    return response.data;
  },

  // Verificar codigo e autenticar (legado)
  verifyCode: async (email: string, code: string) => {
    const response = await apiClient.post<ApiResponse>('/auth/verify-code', { email, code });
    return response.data;
  },

  // Logout
  signOut: async () => {
    const response = await apiClient.post<ApiResponse>('/auth/sign-out');
    return response.data;
  },

  // Obter dados do usuario logado
  getMe: async () => {
    const response = await apiClient.get<ApiResponse>('/auth/me');
    return response.data;
  },

  // Verificar autenticacao
  check: async () => {
    const response = await apiClient.get<ApiResponse>('/auth/check');
    return response.data;
  },

  // Obter permissoes
  getPermissions: async () => {
    const response = await apiClient.get<ApiResponse>('/auth/permissions');
    return response.data;
  },

  // Alterar senha
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.put<ApiResponse>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

// =====================================================
// FILA API (Submissions)
// =====================================================

export interface Submission {
  id: string;
  nome_motorista: string;
  cpf: string;
  telefone?: string;
  email?: string;
  placa?: string;
  tipo_veiculo?: string;
  status: string;
  prioridade?: string;
  operador_id: string;
  analista_id?: string;
  data_envio: string;
  data_inicio_analise?: string;
  data_conclusao?: string;
  observacoes?: string;
  motivo_rejeicao?: string;
  categoria_rejeicao?: string;
  origem?: string;
  destino?: string;
  localizacao_atual?: string;
  tipo_mercadoria?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  operador_nome?: string;
  operador_email?: string;
  analista_nome?: string;
  analista_email?: string;
  documents?: Document[];
}

export interface CreateSubmissionData {
  nomeMotorista?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  placa?: string;
  tipoVeiculo?: string;
  prioridade?: 'normal' | 'alta' | 'urgente';
  observacoes?: string;
  origem?: string;
  destino?: string;
  localizacaoAtual?: string;
  tipoMercadoria?: string;
  requer_rastreamento?: boolean;
}

export const filaApi = {
  // Listar fila
  list: async (params?: {
    status?: string;
    prioridade?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get<ApiResponse<Submission[]>>('/fila', { params });
    return response.data;
  },

  // Detalhes de uma submission
  get: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Submission>>(`/fila/${id}`);
    return response.data;
  },

  // Criar nova submission
  create: async (data: CreateSubmissionData) => {
    const response = await apiClient.post<ApiResponse<Submission>>('/fila', data);
    return response.data;
  },

  // Atualizar submission
  update: async (id: string, data: Partial<CreateSubmissionData>) => {
    const response = await apiClient.put<ApiResponse<Submission>>(`/fila/${id}`, data);
    return response.data;
  },

  // Iniciar analise
  analisar: async (id: string) => {
    const response = await apiClient.post<ApiResponse<Submission>>(`/fila/${id}/analisar`);
    return response.data;
  },

  // Aprovar
  aprovar: async (id: string, observacoes?: string) => {
    const response = await apiClient.post<ApiResponse<Submission>>(`/fila/${id}/aprovar`, { observacoes });
    return response.data;
  },

  // Rejeitar
  rejeitar: async (id: string, motivoRejeicao: string, categoriaRejeicao?: string) => {
    const response = await apiClient.post<ApiResponse<Submission>>(`/fila/${id}/rejeitar`, {
      motivoRejeicao,
      categoria: categoriaRejeicao
    });
    return response.data;
  },

  // Adicionar atraso
  adicionarAtraso: async (id: string, motivo: string) => {
    const response = await apiClient.post<ApiResponse>(`/fila/${id}/adicionar-atraso`, { motivo });
    return response.data;
  },

  // Buscar delays de uma submission
  buscarDelays: async (id: string) => {
    const response = await apiClient.get<ApiResponse>(`/fila/${id}/delays`);
    return response.data;
  },

  // Estatisticas
  stats: async () => {
    const response = await apiClient.get<ApiResponse>('/fila/stats');
    return response.data;
  },

  // Devolver para correção
  devolver: async (id: string, motivoDevolucao: string, categoria?: string) => {
    const response = await apiClient.post<ApiResponse<Submission>>(`/fila/${id}/devolver`, {
      motivoDevolucao,
      categoria
    });
    return response.data;
  },

  // Reenviar após correção
  reenviar: async (id: string, observacoes?: string) => {
    const response = await apiClient.post<ApiResponse<Submission>>(`/fila/${id}/reenviar`, {
      observacoes
    });
    return response.data;
  },
};

// =====================================================
// DOCUMENTS API
// =====================================================

export type DocumentType =
  | 'crlv'
  | 'antt'
  | 'cnh'
  | 'endereco'
  | 'bancario'
  | 'pamcard'
  | 'gr'
  | 'rcv'
  | 'contrato'
  | 'flex'
  | 'cte'
  | 'outros';

export interface Document {
  id: string;
  submission_id: string;
  tipo: DocumentType;
  nome_original: string;
  nome_armazenado?: string;
  mime_type: string;
  tamanho_bytes: number;
  validado: boolean;
  validado_em?: string;
  observacao_validacao?: string;
  uploaded_at: string;
  uploaded_by?: string;
  validado_por?: string;
}

export const documentsApi = {
  // Listar documentos
  list: async (params?: {
    submissionId?: string;
    tipo?: DocumentType;
    validado?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get<PaginatedResponse<Document>>('/documents', { params });
    return response.data;
  },

  // Detalhes de um documento
  get: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Document>>(`/documents/${id}`);
    return response.data;
  },

  // Upload de documento unico
  upload: async (
    file: File,
    submissionId: string,
    tipo: DocumentType,
    onProgress?: (progress: UploadProgress) => void
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('submissionId', submissionId);
    formData.append('tipo', tipo);

    const response = await apiClient.post<ApiResponse<Document>>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          });
        }
      },
    });

    return response.data;
  },

  // Upload de multiplos documentos
  uploadMultiple: async (
    files: { file: File; tipo: DocumentType }[],
    submissionId: string,
    onProgress?: (progress: UploadProgress) => void
  ) => {
    const formData = new FormData();
    formData.append('submissionId', submissionId);

    const tipos: DocumentType[] = [];
    files.forEach(({ file, tipo }) => {
      formData.append('files', file);
      tipos.push(tipo);
    });

    formData.append('tipos', JSON.stringify(tipos));

    const response = await apiClient.post<ApiResponse<Document[]>>(
      '/documents/upload-multiple',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
            });
          }
        },
      }
    );

    return response.data;
  },

  // Validar documento
  validar: async (id: string, validado: boolean, observacao?: string) => {
    const response = await apiClient.put<ApiResponse>(`/documents/${id}/validar`, {
      validado,
      observacao,
    });
    return response.data;
  },

  // Deletar documento
  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/documents/${id}`);
    return response.data;
  },

  // URL de download
  getDownloadUrl: (id: string) => {
    return `${API_BASE_URL}/documents/${id}/download`;
  },

  // Download de documento
  download: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// =====================================================
// DASHBOARD API
// =====================================================

export interface DashboardStats {
  fila: {
    total: number;
    pendentes: number;
    emAnalise: number;
    aprovados: number;
    rejeitados: number;
    tempoMedioMinutos: number;
  };
  documentos: {
    total: number;
    tamanhoTotalBytes: number;
    porTipo: Record<string, number>;
  };
  usuarios: {
    total: number;
    ativos: number;
    porRole: Record<string, number>;
  };
}

export const dashboardApi = {
  // Estatisticas gerais
  stats: async () => {
    const response = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data;
  },

  // Submissions por dia
  submissionsPorDia: async (dias = 30) => {
    const response = await apiClient.get<ApiResponse>('/dashboard/submissions-por-dia', {
      params: { dias },
    });
    return response.data;
  },

  // Top operadores
  topOperadores: async (limit = 10) => {
    const response = await apiClient.get<ApiResponse>('/dashboard/top-operadores', {
      params: { limit },
    });
    return response.data;
  },

  // Resumo do usuario
  meuResumo: async () => {
    const response = await apiClient.get<ApiResponse>('/dashboard/meu-resumo');
    return response.data;
  },

  // Estatisticas de atrasos
  delayStats: async () => {
    const response = await apiClient.get<ApiResponse>('/dashboard/delay-stats');
    return response.data;
  },

  // Metricas de auditoria
  auditMetrics: async (params?: { operador?: string; submissionId?: string }) => {
    const response = await apiClient.get<ApiResponse>('/dashboard/audit-metrics', { params });
    return response.data;
  },
};

// =====================================================
// USERS API
// =====================================================

export interface User {
  id: string;
  email: string;
  nome: string;
  role: 'admin' | 'gestor' | 'operacional' | 'cadastro' | 'comercial' | 'auditor';
  ativo: boolean;
  filial_id?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export const usersApi = {
  // Listar usuarios
  list: async (params?: {
    role?: string;
    ativo?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get<PaginatedResponse<User>>('/users', { params });
    return response.data;
  },

  // Buscar usuario
  get: async (id: string) => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  },

  // Criar usuario
  create: async (data: { email: string; nome: string; role: string; password?: string; filialId?: string }) => {
    const response = await apiClient.post<ApiResponse<User>>('/users', data);
    return response.data;
  },

  // Atualizar usuario
  update: async (
    id: string,
    data: { nome?: string; role?: string; ativo?: boolean; filialId?: string; avatar?: string }
  ) => {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  },

  // Desativar usuario
  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/users/${id}`);
    return response.data;
  },
};

// =====================================================
// TICKETS API (Suporte)
// =====================================================

export interface TicketData {
  titulo: string;
  categoria: 'bug' | 'duvida' | 'sugestao' | 'outro';
  descricao: string;
}

export type TicketStatus = 'aberto' | 'em_andamento' | 'resolvido' | 'fechado';

export interface Ticket extends TicketData {
  id: string;
  status: TicketStatus;
  usuario_id: string | null;
  usuario_nome: string | null;
  usuario_email: string | null;
  resposta: string | null;
  respondido_por: string | null;
  respondido_em: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketStats {
  total: number;
  byStatus: Record<string, number>;
  byCategoria: Record<string, number>;
}

export const ticketApi = {
  // Criar ticket de suporte
  create: async (data: TicketData) => {
    const response = await apiClient.post<ApiResponse<Ticket>>('/tickets', data);
    return response.data;
  },

  // Listar tickets com filtros e paginação
  list: async (params?: {
    status?: TicketStatus;
    categoria?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get<ApiResponse<Ticket[]> & { pagination: { total: number; page: number; pageSize: number; totalPages: number } }>('/tickets', { params });
    return response.data;
  },

  // Detalhes de um ticket
  get: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Ticket>>(`/tickets/${id}`);
    return response.data;
  },

  // Atualizar status (admin/gestor)
  updateStatus: async (id: string, status: TicketStatus) => {
    const response = await apiClient.put<ApiResponse<Ticket>>(`/tickets/${id}/status`, { status });
    return response.data;
  },

  // Responder ticket (admin/gestor)
  responder: async (id: string, resposta: string, status?: TicketStatus) => {
    const response = await apiClient.put<ApiResponse<Ticket>>(`/tickets/${id}/responder`, { resposta, status });
    return response.data;
  },

  // Deletar ticket (admin)
  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/tickets/${id}`);
    return response.data;
  },

  // Estatísticas (admin/gestor)
  stats: async () => {
    const response = await apiClient.get<ApiResponse<TicketStats>>('/tickets/stats/summary');
    return response.data;
  },
};

export default apiClient;
