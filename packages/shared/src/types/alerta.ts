export type TipoAlerta = 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO' | 'INFORMATIVO';
export type StatusAlerta = 'PENDENTE' | 'LIDO' | 'RESPONDIDO' | 'ESCALADO' | 'EXPIRADO' | 'RESOLVIDO';

export interface AcaoRapida {
  id: string;
  label: string;
  value: string;
  cor?: 'success' | 'danger' | 'warning' | 'info';
}

export interface Alerta {
  id: number;
  uuid: string;
  tipo: TipoAlerta;
  titulo: string;
  mensagem: string;

  // Entidade relacionada
  entidade_tipo?: string;
  entidade_id?: string;

  // Status e workflow
  status: StatusAlerta;

  // Destinatários
  destinatario_id?: number;
  destinatario_nome?: string;
  resposta?: string;
  respondido_por?: number;
  respondido_por_nome?: string;
  respondido_em?: Date;

  // Escalação
  escalado_para?: number;
  escalado_para_nome?: string;
  escalado_em?: Date;
  motivo_escalacao?: string;

  // WhatsApp
  whatsapp_message_id?: string;
  whatsapp_enviado: boolean;
  whatsapp_lido: boolean;

  // Expiração
  expires_at?: Date;

  // Ações disponíveis (botões WhatsApp)
  acoes_disponiveis: AcaoRapida[];

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export interface AlertaCreate {
  tipo: TipoAlerta;
  titulo: string;
  mensagem: string;
  entidade_tipo?: string;
  entidade_id?: string;
  destinatario_id?: number;
  expires_at?: Date;
  acoes_disponiveis?: AcaoRapida[];
}

export interface AlertaResponder {
  resposta: string;
  acao_executada?: string;
}

export interface AlertaEscalar {
  escalado_para: number;
  motivo_escalacao: string;
}

export interface AlertaStats {
  total_pendentes: number;
  criticos: number;
  altos: number;
  medios: number;
  baixos: number;
  expirados_hoje: number;
  tempo_medio_resposta_minutos: number;
}
