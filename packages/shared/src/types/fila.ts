export type TipoEntidadeFila = 'MOTORISTA' | 'DOCUMENTO' | 'VEICULO' | 'CLIENTE' | 'FORNECEDOR';
export type StatusFila = 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'REJEITADO' | 'BLOQUEADO';
export type PrioridadeFila = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE' | 'CRITICA';
export type DepartamentoFila = 'OPERACAO' | 'CADASTRO' | 'GR' | 'FINANCEIRO' | 'DIRETORIA';

export interface DocumentoAnexo {
  id: string;
  nome: string;
  url: string;
  tipo: string;
  tamanho: number;
  uploaded_at: string;
}

export interface ComentarioFila {
  id: string;
  usuario_id: number;
  usuario_nome: string;
  texto: string;
  timestamp: string;
}

export interface FilaCadastro {
  id: number;
  uuid: string;
  tipo: TipoEntidadeFila;
  entidade_id: string;
  entidade_nome: string;
  status: StatusFila;
  prioridade: PrioridadeFila;

  // Comunicação
  descricao?: string;
  documentos_anexos: DocumentoAnexo[];
  comentarios: ComentarioFila[];

  // Workflow
  atribuido_a?: number;
  atribuido_a_nome?: string;
  solicitado_por?: number;
  solicitado_por_nome?: string;
  departamento_origem?: DepartamentoFila;
  departamento_destino?: DepartamentoFila;

  // Timestamps
  iniciado_em?: Date;
  finalizado_em?: Date;
  prazo_limite?: Date;

  // Feedback
  motivo_rejeicao?: string;
  observacoes?: string;

  // Tempo calculado
  tempo_espera_minutos: number;

  // Auditoria
  created_at: Date;
  updated_at: Date;
}

export interface FilaCadastroCreate {
  tipo: TipoEntidadeFila;
  entidade_id: string;
  entidade_nome: string;
  prioridade?: PrioridadeFila;
  descricao?: string;
  departamento_origem?: DepartamentoFila;
  departamento_destino?: DepartamentoFila;
  solicitado_por?: number;
  prazo_limite?: Date;
}

export interface FilaCadastroUpdate {
  status?: StatusFila;
  prioridade?: PrioridadeFila;
  atribuido_a?: number;
  motivo_rejeicao?: string;
  observacoes?: string;
}

export interface FilaCadastroStats {
  total: number;
  pendentes: number;
  em_analise: number;
  aprovados_hoje: number;
  rejeitados_hoje: number;
  tempo_medio_minutos: number;
  criticos: number; // > 30min ou prioridade URGENTE/CRITICA
}

// Indicador de cor baseado no tempo de espera
export type CorIndicador = 'VERDE' | 'AMARELO' | 'LARANJA' | 'VERMELHO';

export interface FilaComIndicador extends FilaCadastro {
  cor_indicador: CorIndicador;
}
