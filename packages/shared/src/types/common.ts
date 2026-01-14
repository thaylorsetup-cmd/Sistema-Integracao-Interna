// Tipos comuns usados em toda aplicação

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  details?: any;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface FilterParams {
  search?: string;
  status?: string | string[];
  tipo?: string | string[];
  prioridade?: string | string[];
  data_inicio?: string;
  data_fim?: string;
  [key: string]: any;
}

export interface WebSocketMessage<T = any> {
  event: string;
  data: T;
  timestamp: string;
  room?: string;
}

export interface WebSocketResponse<T = any> {
  success: boolean;
  event: string;
  data?: T;
  error?: string;
}

// Auditoria
export interface AuditLog {
  id: number;
  uuid: string;
  timestamp: Date;
  usuario_id?: number;
  usuario_nome?: string;
  usuario_tipo?: string;
  acao: string;
  modulo: string;
  entidade_tipo?: string;
  entidade_id?: string;
  dados_antes?: any;
  dados_depois?: any;
  diferencas?: any;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  metadata?: any;
  created_at: Date;
}

// Notificações
export interface Notificacao {
  id: number;
  uuid: string;
  usuario_id: number;
  tipo: string;
  titulo: string;
  mensagem?: string;
  link_acao?: string;
  entidade_tipo?: string;
  entidade_id?: number;
  lida: boolean;
  lida_em?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface NotificacaoCreate {
  usuario_id: number;
  tipo: string;
  titulo: string;
  mensagem?: string;
  link_acao?: string;
  entidade_tipo?: string;
  entidade_id?: number;
}
