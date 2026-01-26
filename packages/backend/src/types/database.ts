/**
 * Tipos do Banco de Dados - Kysely
 * Define a estrutura de todas as tabelas
 */
import type { Generated, ColumnType, Insertable, Selectable, Updateable } from 'kysely';

// =====================================================
// TIPOS BASE
// =====================================================

export type UserRole = 'admin' | 'gestor' | 'operacional' | 'cadastro' | 'comercial' | 'auditor';
export type SubmissionStatus = 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';
export type SubmissionPriority = 'normal' | 'alta' | 'urgente';
export type DocumentType = 'crlv' | 'antt' | 'cnh' | 'endereco' | 'bancario' | 'pamcard' | 'gr' | 'rcv' | 'doc_proprietario' | 'end_proprietario' | 'outros';
export type AuditLogType = 'LOGIN' | 'LOGOUT' | 'CRIAR' | 'EDITAR' | 'DELETAR' | 'APROVAR' | 'REJEITAR' | 'VISUALIZAR' | 'EXPORTAR' | 'CONFIG' | 'ATRASO';
export type RejectionCategory = 'documentos-incompletos' | 'documentos-invalidos' | 'informacoes-incorretas' | 'nao-atende-requisitos' | 'outro';

// =====================================================
// TABELA: users
// =====================================================

export interface UsersTable {
  id: Generated<string>;
  email: string;
  nome: string;
  password: string;
  role: UserRole;
  ativo: Generated<boolean>;
  email_verified: Generated<boolean>;
  filial_id: string | null;
  avatar: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

// =====================================================
// TABELA: auth_codes (Codigos OTP)
// =====================================================

export interface AuthCodesTable {
  id: Generated<string>;
  email: string;
  code: string;
  expires_at: Date;
  used: Generated<boolean>;
  ip_address: string | null;
  created_at: Generated<Date>;
}

export type AuthCode = Selectable<AuthCodesTable>;
export type NewAuthCode = Insertable<AuthCodesTable>;

// =====================================================
// TABELA: sessions
// =====================================================

export interface SessionsTable {
  id: Generated<string>;
  token: string;
  user_id: string;
  expires_at: Date;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Generated<Date>;
}

export type Session = Selectable<SessionsTable>;
export type NewSession = Insertable<SessionsTable>;

// =====================================================
// TABELA: submissions (Fila de Cadastros)
// =====================================================

export interface SubmissionsTable {
  id: Generated<string>;
  operador_id: string;
  atribuido_a: string | null;
  status: Generated<SubmissionStatus>;
  prioridade: Generated<SubmissionPriority>;
  motivo_rejeicao: string | null;
  categoria_rejeicao: string | null;
  observacoes: string | null;
  origem: string | null;
  destino: string | null;
  localizacao_atual: string | null;
  tipo_mercadoria: string | null;
  created_at: Generated<Date>;
  started_at: Date | null;
  finished_at: Date | null;
  updated_at: Generated<Date>;
}

export type Submission = Selectable<SubmissionsTable>;
export type NewSubmission = Insertable<SubmissionsTable>;
export type SubmissionUpdate = Updateable<SubmissionsTable>;

// =====================================================
// TABELA: documents
// =====================================================

export interface DocumentsTable {
  id: Generated<string>;
  submission_id: string | null;
  type: DocumentType;
  custom_description: string | null;
  filename: string;
  filepath: string;
  mimetype: string;
  size_bytes: number;
  uploaded_by: string;
  uploaded_at: Generated<Date>;
}

export type Document = Selectable<DocumentsTable>;
export type NewDocument = Insertable<DocumentsTable>;
export type DocumentUpdate = Updateable<DocumentsTable>;

// =====================================================
// TABELA: audit_logs
// =====================================================

export interface AuditLogsTable {
  id: Generated<string>;
  usuario_id: string;
  usuario_nome: string;
  tipo: AuditLogType;
  modulo: string;
  descricao: string;
  detalhes: ColumnType<Record<string, unknown> | null, string | null, string | null>;
  ip: string | null;
  created_at: Generated<Date>;
}

export type AuditLog = Selectable<AuditLogsTable>;
export type NewAuditLog = Insertable<AuditLogsTable>;

// =====================================================
// TABELA: delays (Sistema de Atrasos)
// =====================================================

export interface DelaysTable {
  id: Generated<string>;
  submission_id: string;
  motivo: string;
  criado_por: string;
  criado_em: Generated<Date>;
  notificado: Generated<boolean>;
  notificado_em: Date | null;
}

export type Delay = Selectable<DelaysTable>;
export type NewDelay = Insertable<DelaysTable>;
export type DelayUpdate = Updateable<DelaysTable>;

// =====================================================
// DATABASE INTERFACE
// =====================================================

export interface Database {
  users: UsersTable;
  auth_codes: AuthCodesTable;
  sessions: SessionsTable;
  submissions: SubmissionsTable;
  documents: DocumentsTable;
  audit_logs: AuditLogsTable;
  delays: DelaysTable;
}
