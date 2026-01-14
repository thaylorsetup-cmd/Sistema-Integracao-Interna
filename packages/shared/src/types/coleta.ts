export type StatusColeta =
  | 'DISPONIVEL'
  | 'CADASTRADA'
  | 'CONTRATACAO'
  | 'COLETADA'
  | 'EM_TRANSITO'
  | 'COMANDADA'
  | 'ENTREGUE'
  | 'CANCELADA';

export interface Coleta {
  id: number;
  uuid: string;
  erp_id: string;

  // Dados da coleta
  numero_coleta?: string;
  cliente_codigo?: string;
  cliente_nome?: string;
  cliente_cnpj?: string;

  // Origem e Destino
  origem_cidade?: string;
  origem_uf?: string;
  origem_cep?: string;
  destino_cidade?: string;
  destino_uf?: string;
  destino_cep?: string;

  // Status e valores
  status: StatusColeta;
  valor_frete?: number;
  peso_kg?: number;
  volume_m3?: number;

  // Datas
  data_coleta?: Date;
  data_entrega_prevista?: Date;
  data_entrega_realizada?: Date;

  // Motorista e veículo
  motorista_codigo?: string;
  motorista_nome?: string;
  motorista_cpf?: string;
  veiculo_placa?: string;
  veiculo_tipo?: string;

  // Observações
  observacoes?: string;

  // Sync
  synced_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ColetaResumo {
  status: StatusColeta;
  quantidade: number;
  valor_total: number;
  peso_total: number;
  volume_total: number;
}

export interface ColetaStats {
  total: number;
  por_status: Record<StatusColeta, number>;
  valor_total: number;
  peso_total_kg: number;
  volume_total_m3: number;
  ultima_sync: Date;
}
