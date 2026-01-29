/**
 * Tipos do Banco de Dados - Kysely
 * Define a estrutura de todas as tabelas
 */
import type { Generated, ColumnType, Insertable, Selectable, Updateable } from 'kysely';

// =====================================================
// TIPOS BASE
// =====================================================

export type UserRole = 'admin' | 'gestor' | 'operacional' | 'cadastro' | 'comercial' | 'auditor';
export type SubmissionStatus = 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado' | 'devolvido';
export type SubmissionPriority = 'normal' | 'alta' | 'urgente';
export type DocumentType = 'crlv' | 'antt' | 'cnh' | 'endereco' | 'bancario' | 'pamcard' | 'gr' | 'rcv' | 'flex' | 'cte' | 'contrato' | 'outros';
export type TipoCadastro = 'novo_cadastro' | 'atualizacao' | 'agregado' | 'bens_rodando';

export type RejectionCategory = 'documentos-incompletos' | 'documentos-invalidos' | 'informacoes-incorretas' | 'nao-atende-requisitos' | 'documento_ilegivel' | 'documento_incompleto' | 'dados_incorretos' | 'falta_documento' | 'outro';
export type TicketStatus = 'aberto' | 'em_andamento' | 'resolvido' | 'fechado';
export type TicketCategoria = 'bug' | 'duvida' | 'sugestao' | 'outro';

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

  // Tipo de cadastro (migration 011)
  tipo_cadastro: Generated<TipoCadastro>;

  // Dados do motorista
  nome_motorista: string | null;
  cpf: string | null;
  telefone: string | null;
  email: string | null;

  // Dados do veiculo
  placa: string | null;
  tipo_veiculo: string | null;

  // Status e controle
  status: Generated<SubmissionStatus>;
  prioridade: Generated<SubmissionPriority>;

  // Relacionamentos
  operador_id: string;
  analista_id: string | null;

  // Timestamps de workflow
  data_envio: Generated<Date>;
  data_inicio_analise: Date | null;
  data_conclusao: Date | null;

  // Observacoes
  observacoes: string | null;
  motivo_rejeicao: string | null;
  categoria_rejeicao: string | null;

  // Campos de workflow (migration 006)
  origem: string | null;
  destino: string | null;
  localizacao_atual: string | null;
  tipo_mercadoria: string | null;

  // Rastreamento (migration 011)
  requer_rastreamento: Generated<boolean>;
  coordenadas_rastreamento: ColumnType<Record<string, unknown> | null, string | null, string | null>;

  // Novos campos obrigatórios para Cadastro Novo (migration 011)
  tel_proprietario: string | null;
  endereco_residencial: string | null;
  numero_pis: string | null;
  valor_mercadoria: number | null;
  tel_motorista: string | null;
  referencia_comercial_1: string | null;
  referencia_comercial_2: string | null;
  referencia_pessoal_1: string | null;
  referencia_pessoal_2: string | null;
  referencia_pessoal_3: string | null;

  // Campos de devolucao (migration 012)
  devolvido_em: Date | null;
  devolvido_por: string | null;

  // Metadados
  created_at: Generated<Date>;
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
  submission_id: string;
  tipo: DocumentType;
  nome_original: string;
  nome_armazenado: string;
  mime_type: string;
  tamanho_bytes: number;
  caminho: string;

  // Validacao
  validado: Generated<boolean>;
  validado_por: string | null;
  validado_em: Date | null;
  observacao_validacao: string | null;

  // Upload
  uploaded_by: string | null;
  uploaded_at: Generated<Date>;

  // Metadados
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Document = Selectable<DocumentsTable>;
export type NewDocument = Insertable<DocumentsTable>;
export type DocumentUpdate = Updateable<DocumentsTable>;

// =====================================================
// TABELA: audit_logs
// =====================================================

export interface AuditLogsTable {
  id: Generated<string>;
  user_id: string | null;
  user_email: string | null;
  user_nome: string | null;
  acao: string;
  entidade: string;
  entidade_id: string | null;
  dados_anteriores: ColumnType<Record<string, unknown> | null, string | null, string | null>;
  dados_novos: ColumnType<Record<string, unknown> | null, string | null, string | null>;
  ip_address: string | null;
  user_agent: string | null;
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
// TABELA: tickets (Suporte)
// =====================================================

export interface TicketsTable {
  id: Generated<string>;
  titulo: string;
  categoria: TicketCategoria;
  descricao: string;
  status: Generated<TicketStatus>;
  usuario_id: string | null;
  usuario_nome: string | null;
  usuario_email: string | null;
  resposta: string | null;
  respondido_por: string | null;
  respondido_em: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Ticket = Selectable<TicketsTable>;
export type NewTicket = Insertable<TicketsTable>;
export type TicketUpdate = Updateable<TicketsTable>;

// =====================================================
// TABELA: checklists (Checklist de validação)
// =====================================================

export interface ChecklistsTable {
  id: Generated<string>;
  submission_id: string;
  item_nome: string;
  completado: Generated<boolean>;
  completado_por: string | null;
  completado_em: Date | null;
  observacao: string | null;
  created_at: Generated<Date>;
}

export type Checklist = Selectable<ChecklistsTable>;
export type NewChecklist = Insertable<ChecklistsTable>;
export type ChecklistUpdate = Updateable<ChecklistsTable>;

// =====================================================
// TABELA: checklist_templates (Templates de checklist)
// =====================================================

export interface ChecklistTemplatesTable {
  id: Generated<string>;
  tipo_cadastro: TipoCadastro;
  item_nome: string;
  ordem: number;
  obrigatorio: Generated<boolean>;
  created_at: Generated<Date>;
}

export type ChecklistTemplate = Selectable<ChecklistTemplatesTable>;
export type NewChecklistTemplate = Insertable<ChecklistTemplatesTable>;
export type ChecklistTemplateUpdate = Updateable<ChecklistTemplatesTable>;

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
  tickets: TicketsTable;
  checklists: ChecklistsTable;
  checklist_templates: ChecklistTemplatesTable;
}

