/**
 * Mock Database - Simula dados do PostgreSQL em memória
 * Baseado nos seeds do init.sql e planilha de colaboradores
 *
 * IMPORTANTE: Este é um mock para desenvolvimento.
 * Em produção, conectar ao backend real.
 */

import type { User, Permission, UserRole, LogAuditoria, LogTipo, ConfiguracaoUsuario } from '@/types';

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function agora(): string {
  return new Date().toISOString();
}

function agoraMenos(minutos: number): string {
  const data = new Date();
  data.setMinutes(data.getMinutes() - minutos);
  return data.toISOString();
}

// ============================================================================
// SISTEMA DE PERMISSÕES POR ROLE
// ============================================================================

const PERMISSOES_POR_ROLE: Record<UserRole, Permission> = {
  admin: {
    viewDashboardOperador: true,
    viewDashboardGestao: true,
    viewDashboardCadastroGR: true,
    viewTvDisplay: true,
    viewAuditoria: true,
    exportAuditoria: true,
    viewConfiguracoesPessoais: true,
    viewConfiguracoesSistema: true,
    manageUsers: true,
    manageIntegracoes: true,
    aprovarCadastros: true,
    editarCadastros: true,
    criarCadastros: true,
    deletarCadastros: true,
  },
  gestor: {
    viewDashboardOperador: true,
    viewDashboardGestao: true,
    viewDashboardCadastroGR: true,
    viewTvDisplay: true,
    viewAuditoria: true,
    exportAuditoria: true,
    viewConfiguracoesPessoais: true,
    viewConfiguracoesSistema: false,
    manageUsers: false,
    manageIntegracoes: false,
    aprovarCadastros: true,
    editarCadastros: true,
    criarCadastros: true,
    deletarCadastros: false,
  },
  operacional: {
    viewDashboardOperador: true,
    viewDashboardGestao: false,
    viewDashboardCadastroGR: false,
    viewTvDisplay: true,
    viewAuditoria: false,
    exportAuditoria: false,
    viewConfiguracoesPessoais: true,
    viewConfiguracoesSistema: false,
    manageUsers: false,
    manageIntegracoes: false,
    aprovarCadastros: false,
    editarCadastros: true,
    criarCadastros: true,
    deletarCadastros: false,
  },
  cadastro: {
    viewDashboardOperador: true,
    viewDashboardGestao: false,
    viewDashboardCadastroGR: true,
    viewTvDisplay: true,
    viewAuditoria: false,
    exportAuditoria: false,
    viewConfiguracoesPessoais: true,
    viewConfiguracoesSistema: false,
    manageUsers: false,
    manageIntegracoes: false,
    aprovarCadastros: true,
    editarCadastros: true,
    criarCadastros: true,
    deletarCadastros: false,
  },
  comercial: {
    viewDashboardOperador: true,
    viewDashboardGestao: true,
    viewDashboardCadastroGR: false,
    viewTvDisplay: true,
    viewAuditoria: false,
    exportAuditoria: false,
    viewConfiguracoesPessoais: true,
    viewConfiguracoesSistema: false,
    manageUsers: false,
    manageIntegracoes: false,
    aprovarCadastros: false,
    editarCadastros: true,
    criarCadastros: true,
    deletarCadastros: false,
  },
};

export function getPermissoesPorRole(role: UserRole): Permission {
  return PERMISSOES_POR_ROLE[role];
}

// ============================================================================
// MAPEAMENTO DE DEPARTAMENTOS PARA ROLES
// ============================================================================

// Lista de departamentos permitidos no sistema
const DEPARTAMENTOS_PERMITIDOS = [
  'diretoria',
  'admin/desenvolvedor',
  'desenvolvedor',
  'operacional',
  'expedição',
  'frota',
  'gr',
  'customer service',
  'faturamento',
  'cadastro',
  'comercial',
  'b4 comex'
];

function isDepartamentoPermitido(departamento: string): boolean {
  const deptoLower = departamento.toLowerCase();
  return DEPARTAMENTOS_PERMITIDOS.includes(deptoLower);
}

function mapDepartamentoParaRole(departamento: string, nome: string): UserRole {
  // Thaylor é sempre admin
  if (nome.toLowerCase() === 'thaylor') {
    return 'admin';
  }

  // Wilton da Diretoria é GESTOR (não tem capacidade para funções de admin)
  if (nome.toLowerCase() === 'wilton') {
    return 'gestor';
  }

  const deptoLower = departamento.toLowerCase();

  // Diretoria agora é ADMIN (acesso total) - exceto Wilton que é tratado acima
  if (deptoLower === 'diretoria') {
    return 'admin';
  }

  // Operacional
  if (['operacional', 'expedição', 'frota'].includes(deptoLower)) {
    return 'operacional';
  }

  // Cadastro/GR
  if (['gr', 'customer service', 'faturamento', 'cadastro'].includes(deptoLower)) {
    return 'cadastro';
  }

  // Comercial
  if (['comercial', 'b4 comex'].includes(deptoLower)) {
    return 'comercial';
  }

  // Default para operacional
  return 'operacional';
}

function formatarEmail(nome: string): string {
  // Remove números e caracteres especiais, converte para minúsculas
  const nomeBase = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z\s]/g, '') // Remove caracteres não alfabéticos
    .trim()
    .split(' ')[0]; // Pega só o primeiro nome

  return `${nomeBase}@bbttransportes.com.br`;
}

function formatarTelefone(numero: number): string {
  const numStr = numero.toString();
  return `55${numStr}`;
}

// ============================================================================
// DADOS DOS COLABORADORES (baseado na planilha Excel)
// ============================================================================

interface ColaboradorExcel {
  nome: string;
  departamento: string;
  telefone: number;
}

const colaboradoresExcelCompleto: ColaboradorExcel[] = [
  { nome: 'Thaylor', departamento: 'Admin/Desenvolvedor', telefone: 62999892013 },
  { nome: 'Ednilson', departamento: 'B4 Comex', telefone: 11911635178 },
  { nome: 'Emilly', departamento: 'Faturamento', telefone: 11910642869 },
  { nome: 'Miqueias', departamento: 'Operacional', telefone: 62999407501 },
  { nome: 'Marcius', departamento: 'Comercial', telefone: 62999522283 },
  { nome: 'Igor', departamento: 'Comercial', telefone: 62996122283 },
  { nome: 'Renata', departamento: 'Diretoria', telefone: 62986502283 },
  { nome: 'Mariana', departamento: 'Diretoria', telefone: 62986642283 },
  { nome: 'Maria Ritta', departamento: 'Farma', telefone: 62996732283 },
  { nome: 'Kelly Brenda', departamento: 'Financeiro', telefone: 62986422283 },
  { nome: 'Kelly Ferreira', departamento: 'Financeiro', telefone: 62984642283 },
  { nome: 'Maycon', departamento: 'SP', telefone: 11916505069 },
  { nome: 'Sarah', departamento: 'B4 Comex', telefone: 62999409488 },
  { nome: 'Helio', departamento: 'Fiscal', telefone: 62999408148 },
  { nome: 'Edcarlos', departamento: 'Comercial', telefone: 62996941614 },
  { nome: 'Talita', departamento: 'Customer Service', telefone: 62998259423 },
  { nome: 'Ariele', departamento: 'Fracionado', telefone: 62996098952 },
  { nome: 'Sidney', departamento: 'Operacional', telefone: 64984392283 },
  { nome: 'Wilton', departamento: 'Diretoria', telefone: 64984342283 },
  { nome: 'Jordana Alves', departamento: 'GR', telefone: 64984412283 },
  { nome: 'Jaqueline', departamento: 'Fracionado', telefone: 64996152283 },
  { nome: 'Danubia Oliveira', departamento: 'Operacional', telefone: 62999000073 },
  { nome: 'Junior', departamento: 'Frota', telefone: 62998826714 },
  { nome: 'Regina', departamento: 'Customer Service', telefone: 62999297151 },
  { nome: 'Ianka', departamento: 'Customer Service', telefone: 62999067333 },
  { nome: 'Moroni', departamento: 'B4 Comex', telefone: 62996537789 },
  { nome: 'Jessika', departamento: 'Faturamento', telefone: 62999659192 },
  { nome: 'Bruno Ribeiro', departamento: 'Comercial', telefone: 62998231057 },
  { nome: 'Ester Perez', departamento: 'Customer Service', telefone: 62998790853 },
  { nome: 'Maria Paula', departamento: 'Comercial', telefone: 62999876548 },
  { nome: 'Larissa Machado', departamento: 'RH/DP', telefone: 62998209873 },
  { nome: 'Thiessa', departamento: 'Customer Service', telefone: 62996059829 },
  { nome: 'Mariana Corporativo', departamento: 'Diretoria', telefone: 62998898802 },
  { nome: 'Eduarda', departamento: 'Customer Service', telefone: 62996233500 },
  { nome: 'Adelia', departamento: 'Expedição', telefone: 11912132906 },
  { nome: 'Gabriel Lima', departamento: 'Fracionado', telefone: 62998898766 },
  { nome: 'Agnelo da Silva', departamento: 'Operacional', telefone: 11937630539 },
  { nome: 'Amanda Danniely', departamento: 'B4 Comex', telefone: 62996820773 },
  { nome: 'Julia Corina', departamento: 'B4 Comex', telefone: 1151965810 },
  { nome: 'Bruno Hebert', departamento: 'Belem', telefone: 62999925769 },
  { nome: 'Mariane SA', departamento: 'Comercial', telefone: 11998679732 },
  { nome: 'Cleudiane', departamento: 'Customer Service', telefone: 11937196898 },
  { nome: 'Kannanda', departamento: 'Customer Service', telefone: 62998782669 },
  { nome: 'Nalanda Vasconcelos', departamento: 'Customer Service', telefone: 62999259785 },
  { nome: 'Erik', departamento: 'Expedição', telefone: 62996179116 },
  { nome: 'Karine', departamento: 'Faturamento', telefone: 62999633586 },
  { nome: 'Regina Fracionado', departamento: 'Fracionado', telefone: 62998588786 },
  { nome: 'Victor', departamento: 'Fracionado', telefone: 62999079623 },
  { nome: 'Hellen', departamento: 'Fracionado', telefone: 62999487423 },
  { nome: 'Gilclesio', departamento: 'Fracionado', telefone: 62998570045 },
  { nome: 'Roberta', departamento: 'Fracionado', telefone: 62998775325 },
  { nome: 'Mirtes', departamento: 'GR', telefone: 11934627901 },
  { nome: 'Jullia Pinheiro', departamento: 'GR', telefone: 62998775408 },
  { nome: 'Leonardo', departamento: 'Operacional', telefone: 62996498180 },
  { nome: 'Raiane', departamento: 'Operacional', telefone: 62999178992 },
  { nome: 'Tayna', departamento: 'RH/DP', telefone: 62996377569 },
  { nome: 'Mariana Figueiredo', departamento: 'SP', telefone: 11937622504 },
  { nome: 'Evandro', departamento: 'SP', telefone: 11917532914 },
  { nome: 'Tainallys', departamento: 'Operacional', telefone: 62998482639 },
];

// Filtrar apenas departamentos permitidos: Diretoria, Admin, Operação, Cadastro, Comercial
const colaboradoresExcel = colaboradoresExcelCompleto.filter(colab =>
  isDepartamentoPermitido(colab.departamento)
);

// Gerar usuários a partir da planilha (apenas departamentos permitidos)
const usuariosMock: User[] = colaboradoresExcel.map((colab) => {
  const role = mapDepartamentoParaRole(colab.departamento, colab.nome);
  return {
    id: generateUUID(),
    name: colab.nome,
    email: formatarEmail(colab.nome),
    telefone: formatarTelefone(colab.telefone),
    role,
    departamento: colab.departamento,
    avatar: undefined,
    permissions: getPermissoesPorRole(role),
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
});

// ============================================================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================================================

const SENHA_PADRAO = 'bbt123';

export function autenticarUsuario(email: string, senha: string): User | null {
  // Verifica se a senha é a padrão
  if (senha !== SENHA_PADRAO) {
    return null;
  }

  // Busca usuário por email (case insensitive)
  const usuario = usuariosMock.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.ativo
  );

  return usuario || null;
}

export function getUsuarioByEmail(email: string): User | undefined {
  return usuariosMock.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function getUsuarioById(id: string): User | undefined {
  return usuariosMock.find(u => u.id === id);
}

export function getUsuarios(): User[] {
  return [...usuariosMock];
}

export function getUsuariosPorRole(role: UserRole): User[] {
  return usuariosMock.filter(u => u.role === role);
}

export function getUsuariosPorDepartamento(departamento: string): User[] {
  return usuariosMock.filter(u => u.departamento.toLowerCase() === departamento.toLowerCase());
}

// ============================================================================
// LOGS DE AUDITORIA
// ============================================================================

let logsAuditoria: LogAuditoria[] = [
  {
    id: generateUUID(),
    timestamp: agoraMenos(5),
    usuarioId: 'thaylor',
    usuarioNome: 'Thaylor',
    tipo: 'LOGIN',
    modulo: 'Autenticação',
    descricao: 'Login realizado com sucesso',
  },
  {
    id: generateUUID(),
    timestamp: agoraMenos(15),
    usuarioId: 'jordana',
    usuarioNome: 'Jordana Alves',
    tipo: 'APROVAR',
    modulo: 'Cadastro GR',
    descricao: 'Motorista João Silva aprovado',
    detalhes: { entidadeId: 'MOT001', entidadeTipo: 'MOTORISTA' },
  },
  {
    id: generateUUID(),
    timestamp: agoraMenos(30),
    usuarioId: 'miqueias',
    usuarioNome: 'Miqueias',
    tipo: 'CRIAR',
    modulo: 'Operacional',
    descricao: 'Nova coleta registrada',
    detalhes: { coletaId: 'COL-2024-005' },
  },
  {
    id: generateUUID(),
    timestamp: agoraMenos(60),
    usuarioId: 'thaylor',
    usuarioNome: 'Thaylor',
    tipo: 'CONFIG',
    modulo: 'Configurações',
    descricao: 'Configurações do sistema atualizadas',
  },
  {
    id: generateUUID(),
    timestamp: agoraMenos(120),
    usuarioId: 'wilton',
    usuarioNome: 'Wilton',
    tipo: 'VISUALIZAR',
    modulo: 'Dashboard Gestão',
    descricao: 'Relatório de KPIs visualizado',
  },
  {
    id: generateUUID(),
    timestamp: agoraMenos(180),
    usuarioId: 'marcius',
    usuarioNome: 'Marcius',
    tipo: 'EDITAR',
    modulo: 'Comercial',
    descricao: 'Dados de cliente atualizados',
    detalhes: { clienteId: 'CLI-001' },
  },
];

export function getLogs(filtros?: {
  tipo?: LogTipo[];
  usuarioId?: string;
  modulo?: string;
  dataInicio?: string;
  dataFim?: string;
}): LogAuditoria[] {
  let resultado = [...logsAuditoria];

  if (filtros) {
    if (filtros.tipo && filtros.tipo.length > 0) {
      resultado = resultado.filter(log => filtros.tipo!.includes(log.tipo));
    }
    if (filtros.usuarioId) {
      resultado = resultado.filter(log => log.usuarioId === filtros.usuarioId);
    }
    if (filtros.modulo) {
      resultado = resultado.filter(log => log.modulo.toLowerCase().includes(filtros.modulo!.toLowerCase()));
    }
    if (filtros.dataInicio) {
      resultado = resultado.filter(log => log.timestamp >= filtros.dataInicio!);
    }
    if (filtros.dataFim) {
      resultado = resultado.filter(log => log.timestamp <= filtros.dataFim!);
    }
  }

  // Ordenar por timestamp decrescente (mais recentes primeiro)
  resultado.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return resultado;
}

export function adicionarLog(log: Omit<LogAuditoria, 'id' | 'timestamp'>): LogAuditoria {
  const novoLog: LogAuditoria = {
    ...log,
    id: generateUUID(),
    timestamp: agora(),
  };
  logsAuditoria.unshift(novoLog);
  return novoLog;
}

export function getLogsPorUsuario(usuarioId: string): LogAuditoria[] {
  return logsAuditoria.filter(log => log.usuarioId === usuarioId);
}

// ============================================================================
// CONFIGURAÇÕES DE USUÁRIO
// ============================================================================

const configuracoesUsuarios: Map<string, ConfiguracaoUsuario> = new Map();

const CONFIGURACAO_PADRAO: ConfiguracaoUsuario = {
  tema: 'dark',
  idioma: 'pt-BR',
  notificacoesEmail: true,
  notificacoesWhatsApp: true,
  notificacoesPush: true,
  somNotificacoes: true,
};

export function getConfiguracaoUsuario(usuarioId: string): ConfiguracaoUsuario {
  return configuracoesUsuarios.get(usuarioId) || { ...CONFIGURACAO_PADRAO };
}

export function salvarConfiguracaoUsuario(usuarioId: string, config: Partial<ConfiguracaoUsuario>): ConfiguracaoUsuario {
  const configAtual = getConfiguracaoUsuario(usuarioId);
  const novaConfig = { ...configAtual, ...config };
  configuracoesUsuarios.set(usuarioId, novaConfig);
  return novaConfig;
}

// ============================================================================
// INTERFACES LEGADAS (mantidas para compatibilidade)
// ============================================================================

export interface Usuario {
  id: number;
  uuid: string;
  nome: string;
  email: string;
  telefone: string | null;
  tipo: 'OPERADOR' | 'GESTOR' | 'DIRETOR' | 'ADMIN';
  avatar_url: string | null;
  ativo: boolean;
  ultimo_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface FilaCadastro {
  id: number;
  uuid: string;
  tipo: 'MOTORISTA' | 'DOCUMENTO' | 'VEICULO' | 'CLIENTE' | 'FORNECEDOR';
  entidade_id: string;
  entidade_nome: string;
  status: 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'REJEITADO' | 'BLOQUEADO';
  prioridade: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE' | 'CRITICA';
  descricao: string | null;
  documentos_anexos: unknown[];
  comentarios: Comentario[];
  atribuido_a: number | null;
  solicitado_por: number | null;
  departamento_origem: string | null;
  departamento_destino: string | null;
  iniciado_em: string | null;
  finalizado_em: string | null;
  prazo_limite: string | null;
  motivo_rejeicao: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  tempo_espera_minutos: number;
}

export interface Comentario {
  usuario: string;
  timestamp: string;
  texto: string;
}

export interface Alerta {
  id: number;
  uuid: string;
  tipo: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO' | 'INFORMATIVO';
  titulo: string;
  mensagem: string;
  entidade_tipo: string | null;
  entidade_id: string | null;
  status: 'PENDENTE' | 'LIDO' | 'RESPONDIDO' | 'ESCALADO' | 'EXPIRADO' | 'RESOLVIDO';
  destinatario_id: number | null;
  resposta: string | null;
  respondido_por: number | null;
  respondido_em: string | null;
  escalado_para: number | null;
  escalado_em: string | null;
  motivo_escalacao: string | null;
  whatsapp_message_id: string | null;
  whatsapp_enviado: boolean;
  whatsapp_lido: boolean;
  expires_at: string | null;
  acoes_disponiveis: unknown[];
  created_at: string;
  updated_at: string;
}

export interface Coleta {
  id: number;
  uuid: string;
  erp_id: string;
  numero_coleta: string | null;
  cliente_codigo: string | null;
  cliente_nome: string | null;
  cliente_cnpj: string | null;
  origem_cidade: string | null;
  origem_uf: string | null;
  origem_cep: string | null;
  destino_cidade: string | null;
  destino_uf: string | null;
  destino_cep: string | null;
  status: 'DISPONIVEL' | 'CADASTRADA' | 'CONTRATACAO' | 'COLETADA' | 'EM_TRANSITO' | 'COMANDADA' | 'ENTREGUE' | 'CANCELADA';
  valor_frete: number | null;
  peso_kg: number | null;
  volume_m3: number | null;
  data_coleta: string | null;
  data_entrega_prevista: string | null;
  data_entrega_realizada: string | null;
  motorista_codigo: string | null;
  motorista_nome: string | null;
  motorista_cpf: string | null;
  veiculo_placa: string | null;
  veiculo_tipo: string | null;
  observacoes: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

// Função auxiliar para calcular tempo de espera em minutos
function calcularTempoEspera(created_at: string, finalizado_em: string | null): number {
  const inicio = new Date(created_at).getTime();
  const fim = finalizado_em ? new Date(finalizado_em).getTime() : Date.now();
  return Math.floor((fim - inicio) / (1000 * 60));
}

// ============================================================================
// DADOS LEGADOS EM MEMÓRIA (mantidos para compatibilidade)
// ============================================================================

// Fila de cadastro (mutável)
let filaCadastro: FilaCadastro[] = [
  {
    id: 1,
    uuid: generateUUID(),
    tipo: 'MOTORISTA',
    entidade_id: 'MOT001',
    entidade_nome: 'João Silva Santos',
    status: 'PENDENTE',
    prioridade: 'ALTA',
    descricao: 'Novo motorista - validar documentação',
    documentos_anexos: [],
    comentarios: [],
    atribuido_a: null,
    solicitado_por: 3,
    departamento_origem: 'OPERACAO',
    departamento_destino: 'CADASTRO',
    iniciado_em: null,
    finalizado_em: null,
    prazo_limite: null,
    motivo_rejeicao: null,
    observacoes: null,
    created_at: agoraMenos(45),
    updated_at: agoraMenos(45),
    tempo_espera_minutos: 45,
  },
  {
    id: 2,
    uuid: generateUUID(),
    tipo: 'MOTORISTA',
    entidade_id: 'MOT002',
    entidade_nome: 'Maria Oliveira Costa',
    status: 'PENDENTE',
    prioridade: 'NORMAL',
    descricao: 'Atualização de CNH vencida',
    documentos_anexos: [],
    comentarios: [],
    atribuido_a: null,
    solicitado_por: 3,
    departamento_origem: 'OPERACAO',
    departamento_destino: 'CADASTRO',
    iniciado_em: null,
    finalizado_em: null,
    prazo_limite: null,
    motivo_rejeicao: null,
    observacoes: null,
    created_at: agoraMenos(25),
    updated_at: agoraMenos(25),
    tempo_espera_minutos: 25,
  },
  {
    id: 3,
    uuid: generateUUID(),
    tipo: 'DOCUMENTO',
    entidade_id: 'DOC123',
    entidade_nome: 'CNH - José Pereira',
    status: 'EM_ANALISE',
    prioridade: 'URGENTE',
    descricao: 'Documento com data de nascimento divergente',
    documentos_anexos: [],
    comentarios: [
      {
        usuario: 'Jordana',
        timestamp: agoraMenos(10),
        texto: 'Entrei em contato com o motorista, aguardando retorno',
      },
    ],
    atribuido_a: 1,
    solicitado_por: 1,
    departamento_origem: 'CADASTRO',
    departamento_destino: 'GR',
    iniciado_em: agoraMenos(15),
    finalizado_em: null,
    prazo_limite: null,
    motivo_rejeicao: null,
    observacoes: null,
    created_at: agoraMenos(15),
    updated_at: agoraMenos(10),
    tempo_espera_minutos: 15,
  },
  {
    id: 4,
    uuid: generateUUID(),
    tipo: 'VEICULO',
    entidade_id: 'VEI789',
    entidade_nome: 'Caminhão ABC-1234',
    status: 'PENDENTE',
    prioridade: 'NORMAL',
    descricao: 'Renovação de CRLV',
    documentos_anexos: [],
    comentarios: [],
    atribuido_a: null,
    solicitado_por: 3,
    departamento_origem: 'OPERACAO',
    departamento_destino: 'CADASTRO',
    iniciado_em: null,
    finalizado_em: null,
    prazo_limite: null,
    motivo_rejeicao: null,
    observacoes: null,
    created_at: agoraMenos(10),
    updated_at: agoraMenos(10),
    tempo_espera_minutos: 10,
  },
];

// Alertas (mutável)
let alertas: Alerta[] = [
  {
    id: 1,
    uuid: generateUUID(),
    tipo: 'CRITICO',
    titulo: 'Possível duplicidade de motorista',
    mensagem: 'Motorista "João Silva Santos" já existe no sistema com CPF similar: 123.456.789-00',
    entidade_tipo: 'MOTORISTA',
    entidade_id: 'MOT001',
    status: 'PENDENTE',
    destinatario_id: 1,
    resposta: null,
    respondido_por: null,
    respondido_em: null,
    escalado_para: null,
    escalado_em: null,
    motivo_escalacao: null,
    whatsapp_message_id: null,
    whatsapp_enviado: false,
    whatsapp_lido: false,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    acoes_disponiveis: [],
    created_at: agoraMenos(5),
    updated_at: agoraMenos(5),
  },
  {
    id: 2,
    uuid: generateUUID(),
    tipo: 'ALTO',
    titulo: 'Documento vencido detectado',
    mensagem: 'CNH do motorista Maria Oliveira Costa vence em 3 dias (28/12/2024)',
    entidade_tipo: 'MOTORISTA',
    entidade_id: 'MOT002',
    status: 'PENDENTE',
    destinatario_id: 1,
    resposta: null,
    respondido_por: null,
    respondido_em: null,
    escalado_para: null,
    escalado_em: null,
    motivo_escalacao: null,
    whatsapp_message_id: null,
    whatsapp_enviado: false,
    whatsapp_lido: false,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    acoes_disponiveis: [],
    created_at: agoraMenos(3),
    updated_at: agoraMenos(3),
  },
  {
    id: 3,
    uuid: generateUUID(),
    tipo: 'MEDIO',
    titulo: 'Coleta sem motorista designado',
    mensagem: 'Coleta COL-2024-001 está disponível há 2 horas sem motorista',
    entidade_tipo: 'COLETA',
    entidade_id: 'ERP12345',
    status: 'PENDENTE',
    destinatario_id: 2,
    resposta: null,
    respondido_por: null,
    respondido_em: null,
    escalado_para: null,
    escalado_em: null,
    motivo_escalacao: null,
    whatsapp_message_id: null,
    whatsapp_enviado: false,
    whatsapp_lido: false,
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    acoes_disponiveis: [],
    created_at: agoraMenos(2),
    updated_at: agoraMenos(2),
  },
];

// Coletas (mutável)
let coletas: Coleta[] = [
  {
    id: 1,
    uuid: generateUUID(),
    erp_id: 'ERP12345',
    numero_coleta: 'COL-2024-001',
    cliente_codigo: null,
    cliente_nome: 'Distribuidora ABC Ltda',
    cliente_cnpj: '12.345.678/0001-90',
    origem_cidade: 'São Paulo',
    origem_uf: 'SP',
    origem_cep: null,
    destino_cidade: 'Rio de Janeiro',
    destino_uf: 'RJ',
    destino_cep: null,
    status: 'DISPONIVEL',
    valor_frete: 3500.00,
    peso_kg: 1200.00,
    volume_m3: null,
    data_coleta: new Date().toISOString().split('T')[0],
    data_entrega_prevista: null,
    data_entrega_realizada: null,
    motorista_codigo: null,
    motorista_nome: null,
    motorista_cpf: null,
    veiculo_placa: null,
    veiculo_tipo: null,
    observacoes: null,
    synced_at: agora(),
    created_at: agora(),
    updated_at: agora(),
  },
  {
    id: 2,
    uuid: generateUUID(),
    erp_id: 'ERP12346',
    numero_coleta: 'COL-2024-002',
    cliente_codigo: null,
    cliente_nome: 'Transportes XYZ S.A.',
    cliente_cnpj: '98.765.432/0001-10',
    origem_cidade: 'Curitiba',
    origem_uf: 'PR',
    origem_cep: null,
    destino_cidade: 'Florianópolis',
    destino_uf: 'SC',
    destino_cep: null,
    status: 'CADASTRADA',
    valor_frete: 2200.00,
    peso_kg: 800.00,
    volume_m3: null,
    data_coleta: new Date().toISOString().split('T')[0],
    data_entrega_prevista: null,
    data_entrega_realizada: null,
    motorista_codigo: null,
    motorista_nome: null,
    motorista_cpf: null,
    veiculo_placa: null,
    veiculo_tipo: null,
    observacoes: null,
    synced_at: agora(),
    created_at: agora(),
    updated_at: agora(),
  },
  {
    id: 3,
    uuid: generateUUID(),
    erp_id: 'ERP12347',
    numero_coleta: 'COL-2024-003',
    cliente_codigo: null,
    cliente_nome: 'Logística Rápida',
    cliente_cnpj: '11.222.333/0001-44',
    origem_cidade: 'Brasília',
    origem_uf: 'DF',
    origem_cep: null,
    destino_cidade: 'Goiânia',
    destino_uf: 'GO',
    destino_cep: null,
    status: 'COLETADA',
    valor_frete: 1800.00,
    peso_kg: 600.00,
    volume_m3: null,
    data_coleta: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    data_entrega_prevista: null,
    data_entrega_realizada: null,
    motorista_codigo: 'MOT100',
    motorista_nome: 'Carlos Souza',
    motorista_cpf: null,
    veiculo_placa: 'DEF-5678',
    veiculo_tipo: 'Truck',
    observacoes: null,
    synced_at: agora(),
    created_at: agora(),
    updated_at: agora(),
  },
  {
    id: 4,
    uuid: generateUUID(),
    erp_id: 'ERP12348',
    numero_coleta: 'COL-2024-004',
    cliente_codigo: null,
    cliente_nome: 'Cargas Pesadas Ltda',
    cliente_cnpj: '55.666.777/0001-88',
    origem_cidade: 'Belo Horizonte',
    origem_uf: 'MG',
    origem_cep: null,
    destino_cidade: 'Vitória',
    destino_uf: 'ES',
    destino_cep: null,
    status: 'EM_TRANSITO',
    valor_frete: 2900.00,
    peso_kg: 1500.00,
    volume_m3: null,
    data_coleta: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    data_entrega_prevista: null,
    data_entrega_realizada: null,
    motorista_codigo: 'MOT101',
    motorista_nome: 'Ana Paula',
    motorista_cpf: null,
    veiculo_placa: 'GHI-9012',
    veiculo_tipo: 'Carreta',
    observacoes: null,
    synced_at: agora(),
    created_at: agora(),
    updated_at: agora(),
  },
];

// ============================================================================
// FUNÇÕES LEGADAS DE ACESSO AOS DADOS
// ============================================================================

export interface FilaFiltros {
  status?: string[];
  tipo?: string[];
  prioridade?: string[];
  departamento_origem?: string;
  departamento_destino?: string;
  atribuido_a?: number;
}

export interface AlertaFiltros {
  status?: string[];
  tipo?: string[];
  destinatario_id?: number;
}

export interface ColetaFiltros {
  status?: string[];
  data_coleta?: string;
}

export function getFilaCadastro(filtros?: FilaFiltros): FilaCadastro[] {
  let resultado = [...filaCadastro];

  if (filtros) {
    if (filtros.status) {
      resultado = resultado.filter(item => filtros.status!.includes(item.status));
    }
    if (filtros.tipo) {
      resultado = resultado.filter(item => filtros.tipo!.includes(item.tipo));
    }
    if (filtros.prioridade) {
      resultado = resultado.filter(item => filtros.prioridade!.includes(item.prioridade));
    }
    if (filtros.departamento_origem) {
      resultado = resultado.filter(item => item.departamento_origem === filtros.departamento_origem);
    }
    if (filtros.departamento_destino) {
      resultado = resultado.filter(item => item.departamento_destino === filtros.departamento_destino);
    }
    if (filtros.atribuido_a !== undefined) {
      resultado = resultado.filter(item => item.atribuido_a === filtros.atribuido_a);
    }
  }

  // Atualizar tempo de espera
  resultado.forEach(item => {
    item.tempo_espera_minutos = calcularTempoEspera(item.created_at, item.finalizado_em);
  });

  return resultado;
}

export function getFilaById(id: number): FilaCadastro | undefined {
  const item = filaCadastro.find(f => f.id === id);
  if (item) {
    item.tempo_espera_minutos = calcularTempoEspera(item.created_at, item.finalizado_em);
  }
  return item;
}

export function updateFilaItem(id: number, updates: Partial<FilaCadastro>): FilaCadastro | null {
  const index = filaCadastro.findIndex(f => f.id === id);
  if (index === -1) return null;

  filaCadastro[index] = {
    ...filaCadastro[index],
    ...updates,
    updated_at: agora(),
  };

  return filaCadastro[index];
}

export function adicionarComentario(id: number, usuario: string, texto: string): FilaCadastro | null {
  const item = filaCadastro.find(f => f.id === id);
  if (!item) return null;

  const comentario: Comentario = {
    usuario,
    timestamp: agora(),
    texto,
  };

  item.comentarios = [...item.comentarios, comentario];
  item.updated_at = agora();

  return item;
}

export function getAlertas(filtros?: AlertaFiltros): Alerta[] {
  let resultado = [...alertas];

  if (filtros) {
    if (filtros.status) {
      resultado = resultado.filter(alerta => filtros.status!.includes(alerta.status));
    }
    if (filtros.tipo) {
      resultado = resultado.filter(alerta => filtros.tipo!.includes(alerta.tipo));
    }
    if (filtros.destinatario_id !== undefined) {
      resultado = resultado.filter(alerta => alerta.destinatario_id === filtros.destinatario_id);
    }
  }

  return resultado;
}

export function getAlertaById(id: number): Alerta | undefined {
  return alertas.find(a => a.id === id);
}

export function updateAlerta(id: number, updates: Partial<Alerta>): Alerta | null {
  const index = alertas.findIndex(a => a.id === id);
  if (index === -1) return null;

  alertas[index] = {
    ...alertas[index],
    ...updates,
    updated_at: agora(),
  };

  return alertas[index];
}

export function getColetas(filtros?: ColetaFiltros): Coleta[] {
  let resultado = [...coletas];

  if (filtros) {
    if (filtros.status) {
      resultado = resultado.filter(coleta => filtros.status!.includes(coleta.status));
    }
    if (filtros.data_coleta) {
      resultado = resultado.filter(coleta => coleta.data_coleta === filtros.data_coleta);
    }
  }

  return resultado;
}

export function getColetaById(id: number): Coleta | undefined {
  return coletas.find(c => c.id === id);
}

export function getStats() {
  const totalFila = filaCadastro.length;
  const filaPendente = filaCadastro.filter(f => f.status === 'PENDENTE').length;
  const filaEmAnalise = filaCadastro.filter(f => f.status === 'EM_ANALISE').length;
  const filaAprovados = filaCadastro.filter(f => f.status === 'APROVADO').length;
  const filaRejeitados = filaCadastro.filter(f => f.status === 'REJEITADO').length;

  const totalAlertas = alertas.length;
  const alertasPendentes = alertas.filter(a => a.status === 'PENDENTE').length;
  const alertasCriticos = alertas.filter(a => a.tipo === 'CRITICO' && a.status === 'PENDENTE').length;

  const totalColetas = coletas.length;
  const coletasDisponiveis = coletas.filter(c => c.status === 'DISPONIVEL').length;
  const coletasEmTransito = coletas.filter(c => c.status === 'EM_TRANSITO').length;

  // Calcular tempo médio de atendimento (itens finalizados)
  const finalizados = filaCadastro.filter(f => f.finalizado_em !== null);
  const tempoMedio = finalizados.length > 0
    ? finalizados.reduce((acc, f) => acc + calcularTempoEspera(f.created_at, f.finalizado_em), 0) / finalizados.length
    : 0;

  return {
    fila: {
      total: totalFila,
      pendente: filaPendente,
      em_analise: filaEmAnalise,
      aprovados: filaAprovados,
      rejeitados: filaRejeitados,
      tempo_medio_minutos: Math.round(tempoMedio),
    },
    alertas: {
      total: totalAlertas,
      pendentes: alertasPendentes,
      criticos: alertasCriticos,
    },
    coletas: {
      total: totalColetas,
      disponiveis: coletasDisponiveis,
      em_transito: coletasEmTransito,
    },
  };
}

export function adicionarItemFila(item: Omit<FilaCadastro, 'id' | 'uuid' | 'created_at' | 'updated_at' | 'tempo_espera_minutos'>): FilaCadastro {
  const novoId = Math.max(...filaCadastro.map(f => f.id), 0) + 1;
  const novoItem: FilaCadastro = {
    ...item,
    id: novoId,
    uuid: generateUUID(),
    created_at: agora(),
    updated_at: agora(),
    tempo_espera_minutos: 0,
  };

  filaCadastro.push(novoItem);
  return novoItem;
}

export function adicionarAlerta(alerta: Omit<Alerta, 'id' | 'uuid' | 'created_at' | 'updated_at'>): Alerta {
  const novoId = Math.max(...alertas.map(a => a.id), 0) + 1;
  const novoAlerta: Alerta = {
    ...alerta,
    id: novoId,
    uuid: generateUUID(),
    created_at: agora(),
    updated_at: agora(),
  };

  alertas.push(novoAlerta);
  return novoAlerta;
}

export function resetDatabase(): void {
  filaCadastro = [];
  alertas = [];
  coletas = [];
  logsAuditoria = [];
}
