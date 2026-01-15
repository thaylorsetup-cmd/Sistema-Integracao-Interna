/**
 * Tipos do banco de dados para Kysely
 */

import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

// Tipos de usuário
export type UserRole = 'admin' | 'gestor' | 'operacional' | 'cadastro' | 'comercial';

// Tabela: users
export interface UsersTable {
    id: Generated<string>;
    name: string;
    email: string;
    password_hash: string;
    telefone: string | null;
    role: UserRole;
    departamento: string;
    avatar: string | null;
    ativo: boolean;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

// Tipos de documento
export type DocumentType =
    | 'crlv'
    | 'antt'
    | 'cnh'
    | 'endereco'
    | 'bancario'
    | 'pamcard'
    | 'gr'
    | 'rcv'
    | 'doc_prop'
    | 'end_prop'
    | 'outros';

// Tabela: documents
export interface DocumentsTable {
    id: Generated<string>;
    submission_id: string;
    type: DocumentType;
    custom_description: string | null;
    filename: string;
    filepath: string;
    mimetype: string;
    size_bytes: number;
    uploaded_at: Generated<Date>;
}

export type Document = Selectable<DocumentsTable>;
export type NewDocument = Insertable<DocumentsTable>;
export type DocumentUpdate = Updateable<DocumentsTable>;

// Status de submissão
export type SubmissionStatus = 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';
export type SubmissionPriority = 'normal' | 'alta' | 'urgente';

// Tabela: submissions
export interface SubmissionsTable {
    id: Generated<string>;
    operador_id: string;
    atribuido_a: string | null;
    status: SubmissionStatus;
    prioridade: SubmissionPriority;
    created_at: Generated<Date>;
    started_at: Date | null;
    finished_at: Date | null;
    motivo_rejeicao: string | null;
}

export type Submission = Selectable<SubmissionsTable>;
export type NewSubmission = Insertable<SubmissionsTable>;
export type SubmissionUpdate = Updateable<SubmissionsTable>;

// Tipos de log
export type LogType =
    | 'LOGIN'
    | 'LOGOUT'
    | 'CRIAR'
    | 'EDITAR'
    | 'DELETAR'
    | 'APROVAR'
    | 'REJEITAR'
    | 'VISUALIZAR'
    | 'EXPORTAR'
    | 'CONFIG';

// Tabela: audit_logs
export interface AuditLogsTable {
    id: Generated<string>;
    usuario_id: string;
    usuario_nome: string;
    timestamp: Generated<Date>;
    tipo: LogType;
    modulo: string;
    descricao: string;
    detalhes: Record<string, unknown> | null;
    ip: string | null;
}

export type AuditLog = Selectable<AuditLogsTable>;
export type NewAuditLog = Insertable<AuditLogsTable>;

// Tabela: notifications
export interface NotificationsTable {
    id: Generated<string>;
    usuario_id: string;
    titulo: string;
    mensagem: string;
    tipo: 'info' | 'success' | 'warning' | 'error';
    lida: boolean;
    created_at: Generated<Date>;
}

export type Notification = Selectable<NotificationsTable>;
export type NewNotification = Insertable<NotificationsTable>;

// Tabela: user_settings
export interface UserSettingsTable {
    id: Generated<string>;
    usuario_id: string;
    tema: 'dark' | 'light' | 'system';
    idioma: 'pt-BR' | 'en-US' | 'es-ES';
    notif_email: boolean;
    notif_whatsapp: boolean;
    notif_push: boolean;
    som_notificacoes: boolean;
}

export type UserSettings = Selectable<UserSettingsTable>;
export type NewUserSettings = Insertable<UserSettingsTable>;
export type UserSettingsUpdate = Updateable<UserSettingsTable>;

// Interface do banco completo
export interface Database {
    users: UsersTable;
    documents: DocumentsTable;
    submissions: SubmissionsTable;
    audit_logs: AuditLogsTable;
    notifications: NotificationsTable;
    user_settings: UserSettingsTable;
}
