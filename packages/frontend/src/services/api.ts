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
};

// =====================================================
// FILA API (Submissions)
// =====================================================

export interface Submission {
  id: string;
  tipo_cadastro: string;
  status: string;
  prioridade?: string;
  dados: Record<string, unknown>;
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  finished_at?: string;
  observacoes?: string;
  motivo_rejeicao?: string;
  categoria_rejeicao?: string;
  origem?: string;
  destino?: string;
  localizacao_atual?: string;
  tipo_mercadoria?: string;
  documents?: Document[];
}

export interface CreateSubmissionData {
  tipo_cadastro: string;
  dados?: Record<string, unknown>;
  prioridade?: 'normal' | 'alta' | 'urgente';
  observacoes?: string;
  origem?: string;
  destino?: string;
  localizacaoAtual?: string;
  tipoMercadoria?: string;
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
      motivo_rejeicao: motivoRejeicao,
      categoria_rejeicao: categoriaRejeicao
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
  | 'outros';

export interface Document {
  id: string;
  submission_id: string;
  tipo: DocumentType;
  original_name: string;
  stored_name: string;
  mime_type: string;
  size_bytes: number;
  validated: boolean;
  validated_at?: string;
  validation_notes?: string;
  uploaded_at: string;
  uploaded_by?: string;
  validated_by?: string;
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
  create: async (data: { email: string; nome: string; role: string; filialId?: string }) => {
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

export interface Ticket extends TicketData {
  id: string;
  status: 'aberto' | 'em_andamento' | 'resolvido';
  created_at: string;
}

export const ticketApi = {
  // Criar ticket de suporte
  create: async (data: TicketData) => {
    const response = await apiClient.post<ApiResponse<Ticket>>('/tickets', data);
    return response.data;
  },

  // Listar tickets
  list: async () => {
    const response = await apiClient.get<ApiResponse<Ticket[]>>('/tickets');
    return response.data;
  },
};

export default apiClient;
