/**
 * Tipos globais da aplicação Guardião V2 - BBT Connect
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// SISTEMA DE AUTENTICAÇÃO E PERMISSÕES
// ============================================================================

export type UserRole = 'admin' | 'gestor' | 'operacional' | 'cadastro' | 'comercial' | 'auditor';

export interface Permission {
  // Dashboards
  viewDashboardOperador: boolean;
  viewDashboardGestao: boolean;
  viewDashboardCadastroGR: boolean;
  viewTvDisplay: boolean;

  // Auditoria
  viewAuditoria: boolean;
  exportAuditoria: boolean;

  // Configurações
  viewConfiguracoesPessoais: boolean;
  viewConfiguracoesSistema: boolean;
  manageUsers: boolean;
  manageIntegracoes: boolean;

  // Ações
  aprovarCadastros: boolean;
  editarCadastros: boolean;
  criarCadastros: boolean;
  deletarCadastros: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  telefone?: string;
  role: UserRole;
  departamento: string;
  avatar?: string;
  permissions: Permission;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ============================================================================
// LOGS DE AUDITORIA
// ============================================================================

export type LogTipo = 'LOGIN' | 'LOGOUT' | 'CRIAR' | 'EDITAR' | 'DELETAR' | 'APROVAR' | 'REJEITAR' | 'VISUALIZAR' | 'EXPORTAR' | 'CONFIG';

export interface LogAuditoria {
  id: string;
  timestamp: string;
  usuarioId: string;
  usuarioNome: string;
  tipo: LogTipo;
  modulo: string;
  descricao: string;
  detalhes?: Record<string, unknown>;
  ip?: string;
}

// ============================================================================
// CONFIGURAÇÕES DO USUÁRIO
// ============================================================================

export interface ConfiguracaoUsuario {
  tema: 'dark' | 'light' | 'system';
  idioma: 'pt-BR' | 'en-US' | 'es-ES';
  notificacoesEmail: boolean;
  notificacoesWhatsApp: boolean;
  notificacoesPush: boolean;
  somNotificacoes: boolean;
}

export interface ConfiguracaoSistema {
  nomeEmpresa: string;
  logoUrl: string;
  corPrimaria: string;
  corSecundaria: string;
  emailSuporte: string;
  whatsappSuporte: string;
}
