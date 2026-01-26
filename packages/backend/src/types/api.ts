/**
 * Tipos da API - Request e Response
 */
import type { Request } from 'express';
import type { User } from './database.js';

// =====================================================
// REQUEST CUSTOMIZADO
// =====================================================

export interface AuthenticatedRequest extends Request {
  user?: User;
  session?: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
}

// =====================================================
// RESPOSTAS DA API
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

// =====================================================
// PERMISSOES
// =====================================================

export interface Permission {
  viewDashboardOperador: boolean;
  viewDashboardGestao: boolean;
  viewDashboardCadastroGR: boolean;
  viewTvDisplay: boolean;
  viewAuditoria: boolean;
  exportAuditoria: boolean;
  viewConfiguracoesPessoais: boolean;
  viewConfiguracoesSistema: boolean;
  manageUsers: boolean;
  manageIntegracoes: boolean;
  aprovarCadastros: boolean;
  editarCadastros: boolean;
  criarCadastros: boolean;
  deletarCadastros: boolean;
}

// =====================================================
// ESTATISTICAS
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
    porTipo: Record<string, number>;
    tamanhoTotalBytes: number;
  };
  usuarios: {
    total: number;
    ativos: number;
    porRole: Record<string, number>;
  };
}

// =====================================================
// WEBSOCKET EVENTS
// =====================================================

export interface SocketEvents {
  // Server -> Client
  'submission:new': (data: { id: string; status: string; prioridade: string }) => void;
  'submission:updated': (data: { id: string; status: string; previousStatus: string }) => void;
  'submission:delay': (data: { submissionId: string; delay: any; submission: any }) => void;
  'notification': (data: { type: string; title?: string; message: string; submissionId?: string }) => void;
  'dashboard:stats': (data: any) => void;

  // Client -> Server
  'join:fila': () => void;
  'leave:fila': () => void;
  'join:user': (userId: string) => void;
  'join:dashboard': () => void;
}
