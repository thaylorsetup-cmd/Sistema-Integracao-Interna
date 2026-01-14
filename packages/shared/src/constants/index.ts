// =====================================================
// CONSTANTES COMPARTILHADAS - GUARDIÃO V2
// =====================================================

// ========== CORES BBT TRANSPORTES ==========
export const CORES_BBT = {
  azul_primario: '#0d6efd',
  azul_secundario: '#0654c4',
  azul_claro: '#c4d0ff',
  cinza_neutro: '#32373c',
  branco: '#ffffff',

  // Cores funcionais
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
} as const;

// ========== TEMPO DE ESPERA (COLORIZAÇÃO) ==========
export const TEMPO_LIMITES = {
  VERDE: 15, // < 15min
  AMARELO: 30, // 15-30min
  LARANJA: 60, // 30-60min
  VERMELHO: Infinity, // > 60min
} as const;

export const COR_POR_TEMPO = (minutos: number): string => {
  if (minutos < TEMPO_LIMITES.VERDE) return CORES_BBT.success;
  if (minutos < TEMPO_LIMITES.AMARELO) return CORES_BBT.warning;
  if (minutos < TEMPO_LIMITES.LARANJA) return CORES_BBT.error;
  return '#dc2626'; // vermelho escuro
};

// ========== ESCALAÇÃO DE ALERTAS ==========
export const ESCALACAO = {
  TEMPO_ESCALAR_GESTOR: 15, // minutos
  TEMPO_ESCALAR_DIRETOR: 30, // minutos
  TEMPO_EXPIRAR: 60, // minutos
} as const;

// ========== SINCRONIZAÇÃO ==========
export const SYNC_INTERVALS = {
  COLETAS: 5 * 60 * 1000, // 5 minutos em ms
  ALERTAS_ESCALACAO: 15 * 60 * 1000, // 15 minutos em ms
  WEBSOCKET_HEARTBEAT: 30 * 1000, // 30 segundos
} as const;

// ========== LABELS/TEXTOS ==========
export const LABELS = {
  TIPOS_ENTIDADE: {
    MOTORISTA: 'Motorista',
    DOCUMENTO: 'Documento',
    VEICULO: 'Veículo',
    CLIENTE: 'Cliente',
    FORNECEDOR: 'Fornecedor',
  },
  STATUS_FILA: {
    PENDENTE: 'Pendente',
    EM_ANALISE: 'Em Análise',
    APROVADO: 'Aprovado',
    REJEITADO: 'Rejeitado',
    BLOQUEADO: 'Bloqueado',
  },
  PRIORIDADE: {
    BAIXA: 'Baixa',
    NORMAL: 'Normal',
    ALTA: 'Alta',
    URGENTE: 'Urgente',
    CRITICA: 'Crítica',
  },
  DEPARTAMENTOS: {
    OPERACAO: 'Operação',
    CADASTRO: 'Cadastro',
    GR: 'GR',
    FINANCEIRO: 'Financeiro',
    DIRETORIA: 'Diretoria',
  },
  TIPOS_ALERTA: {
    CRITICO: 'Crítico',
    ALTO: 'Alto',
    MEDIO: 'Médio',
    BAIXO: 'Baixo',
    INFORMATIVO: 'Informativo',
  },
  STATUS_ALERTA: {
    PENDENTE: 'Pendente',
    LIDO: 'Lido',
    RESPONDIDO: 'Respondido',
    ESCALADO: 'Escalado',
    EXPIRADO: 'Expirado',
    RESOLVIDO: 'Resolvido',
  },
  STATUS_COLETA: {
    DISPONIVEL: 'Disponível',
    CADASTRADA: 'Cadastrada',
    CONTRATACAO: 'Contratação',
    COLETADA: 'Coletada',
    EM_TRANSITO: 'Em Trânsito',
    COMANDADA: 'Comandada',
    ENTREGUE: 'Entregue',
    CANCELADA: 'Cancelada',
  },
  TIPOS_USUARIO: {
    OPERADOR: 'Operador',
    GESTOR: 'Gestor',
    DIRETOR: 'Diretor',
    ADMIN: 'Administrador',
  },
} as const;

// ========== PERMISSÕES POR TIPO DE USUÁRIO ==========
export const PERMISSOES = {
  OPERADOR: [
    'fila:ver',
    'fila:iniciar',
    'fila:aprovar',
    'fila:rejeitar',
    'fila:comentar',
    'alertas:ver',
    'alertas:responder',
    'documentos:upload',
  ],
  GESTOR: [
    'fila:ver',
    'fila:iniciar',
    'fila:aprovar',
    'fila:rejeitar',
    'fila:comentar',
    'fila:atribuir',
    'alertas:ver',
    'alertas:responder',
    'alertas:escalar',
    'alertas:criar',
    'documentos:upload',
    'relatorios:ver',
    'audit:ver',
  ],
  DIRETOR: [
    'fila:*',
    'alertas:*',
    'coletas:*',
    'documentos:*',
    'relatorios:*',
    'audit:*',
    'usuarios:ver',
  ],
  ADMIN: ['*'],
} as const;

// ========== WEBSOCKET EVENTS ==========
export const WS_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Fila
  FILA_NOVA: 'fila:nova',
  FILA_ATUALIZADA: 'fila:atualizada',
  FILA_APROVADA: 'fila:aprovada',
  FILA_REJEITADA: 'fila:rejeitada',
  FILA_ATRIBUIDA: 'fila:atribuida',
  FILA_COMENTARIO: 'fila:comentario',

  // Alertas
  ALERTA_NOVO: 'alerta:novo',
  ALERTA_RESPONDIDO: 'alerta:respondido',
  ALERTA_ESCALADO: 'alerta:escalado',
  ALERTA_EXPIRADO: 'alerta:expirado',

  // Coletas
  COLETAS_SYNC: 'coletas:sync',
  COLETA_ATUALIZADA: 'coleta:atualizada',

  // Notificações
  NOTIFICACAO: 'notificacao',

  // System
  STATS_UPDATED: 'stats:updated',
} as const;

// ========== API ENDPOINTS ==========
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_ME: '/api/auth/me',
  AUTH_REFRESH: '/api/auth/refresh',

  // Fila
  FILA_LIST: '/api/fila',
  FILA_GET: '/api/fila/:id',
  FILA_CREATE: '/api/fila',
  FILA_INICIAR: '/api/fila/:id/iniciar',
  FILA_APROVAR: '/api/fila/:id/aprovar',
  FILA_REJEITAR: '/api/fila/:id/rejeitar',
  FILA_COMENTAR: '/api/fila/:id/comentar',
  FILA_ATRIBUIR: '/api/fila/:id/atribuir',
  FILA_STATS: '/api/fila/stats',
  FILA_CRITICOS: '/api/fila/criticos',

  // Alertas
  ALERTAS_LIST: '/api/alertas',
  ALERTAS_GET: '/api/alertas/:id',
  ALERTAS_CREATE: '/api/alertas',
  ALERTAS_RESPONDER: '/api/alertas/:id/responder',
  ALERTAS_ESCALAR: '/api/alertas/:id/escalar',
  ALERTAS_STATS: '/api/alertas/stats',

  // Coletas
  COLETAS_LIST: '/api/coletas',
  COLETAS_GET: '/api/coletas/:id',
  COLETAS_RESUMO: '/api/coletas/resumo',
  COLETAS_SYNC: '/api/coletas/sync',
  COLETAS_STATS: '/api/coletas/stats',

  // Audit
  AUDIT_LIST: '/api/audit',
  AUDIT_USUARIO: '/api/audit/usuario/:id',
  AUDIT_ENTIDADE: '/api/audit/entidade/:tipo/:id',

  // Notificações
  NOTIFICACOES_LIST: '/api/notificacoes',
  NOTIFICACOES_MARCAR_LIDA: '/api/notificacoes/:id/lida',
  NOTIFICACOES_MARCAR_TODAS_LIDAS: '/api/notificacoes/marcar-todas-lidas',

  // Documentos
  DOCUMENTOS_UPLOAD: '/api/documentos/upload',
  DOCUMENTOS_GET: '/api/documentos/:id',
  DOCUMENTOS_DELETE: '/api/documentos/:id',
} as const;

// ========== VALIDAÇÕES ==========
export const VALIDATIONS = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  TELEFONE_REGEX: /^\d{10,11}$/,
  CPF_REGEX: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  CNPJ_REGEX: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  PLACA_REGEX: /^[A-Z]{3}\d{1}[A-Z0-9]{1}\d{2}$/,

  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;

// ========== FORMATAÇÃO ==========
export const formatarTempo = (minutos: number): string => {
  if (minutos < 60) return `${Math.floor(minutos)}min`;
  const horas = Math.floor(minutos / 60);
  const mins = Math.floor(minutos % 60);
  return `${horas}h${mins > 0 ? ` ${mins}min` : ''}`;
};

export const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

export const formatarData = (data: Date | string): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(data));
};

export const formatarDataHora = (data: Date | string): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data));
};
