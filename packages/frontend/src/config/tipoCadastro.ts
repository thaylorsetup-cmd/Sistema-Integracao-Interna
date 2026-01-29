/**
 * Configuracao dos tipos de cadastro
 * Define campos obrigatorios, documentos e labels para cada tipo
 */

export type TipoCadastro = 'novo_cadastro' | 'atualizacao' | 'agregado' | 'bens_rodando';
export type DocumentType = 'crlv' | 'antt' | 'cnh' | 'endereco' | 'bancario' | 'pamcard' | 'gr' | 'rcv' | 'contrato' | 'flex' | 'cte' | 'outros';

export interface TipoCadastroConfig {
  id: TipoCadastro;
  label: string;
  descricao: string;
  icon: string;
  color: string;
  camposObrigatorios: string[];
  camposOpcionais: string[];
  documentosObrigatorios: DocumentType[];
  documentosOpcionais: DocumentType[];
  documentMinQuantity?: Partial<Record<DocumentType, number>>;
  requerRastreamento?: boolean;
}

export const TIPOS_CADASTRO: Record<TipoCadastro, TipoCadastroConfig> = {
  novo_cadastro: {
    id: 'novo_cadastro',
    label: 'Novo Cadastro',
    descricao: 'Cadastro completo de novo motorista/veiculo',
    icon: 'UserPlus',
    color: 'emerald',
    camposObrigatorios: [
      'nomeMotorista',
      'cpf',
      'telefone',
      'telProprietario',
      'enderecoResidencial',
      'numeroPis',
      'origem',
      'destino',
      'valorMercadoria',
      'tipoMercadoria',
      'telMotorista',
      'referenciaComercial1',
      'referenciaComercial2',
      'referenciaPessoal1',
      'referenciaPessoal2',
      'referenciaPessoal3',
    ],
    camposOpcionais: ['placa', 'tipoVeiculo', 'email', 'observacoes', 'prioridade'],
    documentosObrigatorios: ['crlv', 'antt', 'cnh', 'endereco', 'bancario'],
    documentosOpcionais: ['gr', 'rcv', 'flex', 'cte', 'outros'],
    documentMinQuantity: {
      crlv: 3, // CRLV requer 3 documentos (cavalo + 2 carretas)
    },
    requerRastreamento: true,
  },
  atualizacao: {
    id: 'atualizacao',
    label: 'Atualizacao',
    descricao: 'Atualizacao de documentos existentes',
    icon: 'RefreshCw',
    color: 'blue',
    camposObrigatorios: ['cpf', 'placa'],
    camposOpcionais: ['nomeMotorista', 'telefone', 'email', 'observacoes', 'prioridade'],
    documentosObrigatorios: ['crlv'],
    documentosOpcionais: ['antt', 'cnh', 'endereco', 'bancario', 'outros'],
  },
  agregado: {
    id: 'agregado',
    label: 'Agregado',
    descricao: 'Cadastro de motorista agregado',
    icon: 'Users',
    color: 'purple',
    camposObrigatorios: ['nomeMotorista', 'cpf', 'telefone'],
    camposOpcionais: ['placa', 'tipoVeiculo', 'email', 'observacoes', 'prioridade'],
    documentosObrigatorios: ['cnh', 'antt'],
    documentosOpcionais: ['crlv', 'bancario', 'outros'],
  },
  bens_rodando: {
    id: 'bens_rodando',
    label: 'Bens Rodando',
    descricao: 'Cadastro simplificado para operacao',
    icon: 'Truck',
    color: 'orange',
    camposObrigatorios: ['placa', 'tipoVeiculo'],
    camposOpcionais: ['nomeMotorista', 'cpf', 'telefone', 'observacoes', 'prioridade'],
    documentosObrigatorios: [], // SEM obrigatoriedade documental
    documentosOpcionais: ['crlv', 'antt', 'cnh', 'gr', 'rcv', 'outros'],
  },
};

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  crlv: 'CRLV (Cavalo e Carreta)',
  antt: 'ANTT (Veiculo)',
  cnh: 'CNH Motorista',
  endereco: 'Comprovante de Endereco',
  bancario: 'Dados Bancarios',
  pamcard: 'PAMCARD/TAG',
  gr: 'GR (Gerenciadora de Risco)',
  rcv: 'Certificado RCV',
  contrato: 'Contrato',
  flex: 'FLEX',
  cte: 'CT-e',
  outros: 'Outros',
};

export const FIELD_LABELS: Record<string, string> = {
  nomeMotorista: 'Nome do Motorista',
  cpf: 'CPF',
  telefone: 'Telefone',
  email: 'E-mail',
  placa: 'Placa do Veiculo',
  tipoVeiculo: 'Tipo de Veiculo',
  telProprietario: 'Telefone do Proprietario',
  enderecoResidencial: 'Endereco Residencial',
  numeroPis: 'Numero PIS',
  origem: 'Origem',
  destino: 'Destino',
  valorMercadoria: 'Valor da Mercadoria',
  tipoMercadoria: 'Tipo de Mercadoria',
  telMotorista: 'Telefone do Motorista',
  referenciaComercial1: 'Referencia Comercial 1',
  referenciaComercial2: 'Referencia Comercial 2',
  referenciaPessoal1: 'Referencia Pessoal 1',
  referenciaPessoal2: 'Referencia Pessoal 2',
  referenciaPessoal3: 'Referencia Pessoal 3',
  observacoes: 'Observacoes',
  prioridade: 'Prioridade',
  localizacaoAtual: 'Localizacao Atual',
};

export const TIPO_MERCADORIA_OPTIONS = [
  { value: 'carga-seca', label: 'Carga Seca' },
  { value: 'refrigerada', label: 'Refrigerada' },
  { value: 'perigosa', label: 'Perigosa' },
  { value: 'fragil', label: 'Fragil' },
  { value: 'eletronicos', label: 'Eletronicos' },
  { value: 'medicamentos', label: 'Medicamentos' },
  { value: 'outros', label: 'Outros' },
];

export const TIPO_VEICULO_OPTIONS = [
  { value: 'truck', label: 'Truck' },
  { value: 'carreta', label: 'Carreta' },
  { value: 'bitrem', label: 'Bitrem' },
  { value: 'rodotrem', label: 'Rodotrem' },
  { value: 'vuc', label: 'VUC' },
  { value: '3/4', label: '3/4' },
  { value: 'toco', label: 'Toco' },
  { value: 'outros', label: 'Outros' },
];

/**
 * Verifica se a carga requer rastreamento baseado no valor e tipo
 */
export function verificarRastreamento(tipo: TipoCadastro, valorMercadoria?: number): boolean {
  const config = TIPOS_CADASTRO[tipo];
  if (!config.requerRastreamento) return false;

  const valorMinimo = 500000; // R$ 500.000
  return valorMercadoria ? valorMercadoria >= valorMinimo : false;
}

/**
 * Obter configuracao de um tipo de cadastro
 */
export function getTipoCadastroConfig(tipo: TipoCadastro): TipoCadastroConfig {
  return TIPOS_CADASTRO[tipo];
}

/**
 * Verificar se todos os campos obrigatorios estao preenchidos
 */
export function validarCamposObrigatorios(
  config: TipoCadastroConfig,
  dados: Record<string, unknown>
): { valido: boolean; camposFaltantes: string[] } {
  const camposFaltantes: string[] = [];

  for (const campo of config.camposObrigatorios) {
    const valor = dados[campo];
    if (valor === undefined || valor === null || valor === '') {
      camposFaltantes.push(campo);
    }
  }

  return {
    valido: camposFaltantes.length === 0,
    camposFaltantes,
  };
}

/**
 * Verificar se todos os documentos obrigatorios foram enviados
 */
export function validarDocumentosObrigatorios(
  config: TipoCadastroConfig,
  documentosEnviados: DocumentType[]
): { valido: boolean; documentosFaltantes: DocumentType[] } {
  const documentosFaltantes: DocumentType[] = [];

  // Contar documentos por tipo
  const contagem: Partial<Record<DocumentType, number>> = {};
  for (const doc of documentosEnviados) {
    contagem[doc] = (contagem[doc] || 0) + 1;
  }

  for (const doc of config.documentosObrigatorios) {
    const minimo = config.documentMinQuantity?.[doc] || 1;
    const enviados = contagem[doc] || 0;

    if (enviados < minimo) {
      documentosFaltantes.push(doc);
    }
  }

  return {
    valido: documentosFaltantes.length === 0,
    documentosFaltantes,
  };
}
