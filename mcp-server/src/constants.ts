// src/constants.ts
// Constantes compartilhadas do MCP

export const CHARACTER_LIMIT = 50000;

export const DANGEROUS_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'TRUNCATE',
  'ALTER',
  'CREATE',
  'EXEC',
  'EXECUTE',
  'GRANT',
  'REVOKE',
  'DENY'
];

export const MODULE_PATTERNS: Record<string, string[]> = {
  coleta: ['COLETA', 'COL_', 'COLETAS'],
  motorista: ['MOTOR', 'MOTORISTA', 'CONDUTOR', 'DRIVER'],
  veiculo: ['VEICULO', 'VEIC', 'PLACA', 'FROTA'],
  cte: ['CTE', 'CTRC', 'CONHECIMENTO', 'CT_E'],
  nfe: ['NFE', 'NF_E', 'NOTA', 'NOTAFISCAL'],
  fatura: ['FATURA', 'FAT_', 'FATURAMENTO', 'INVOICE'],
  pagamento: ['PAGAMENTO', 'PAG_', 'PAGAR', 'PAYMENT'],
  receber: ['RECEBER', 'REC_', 'RECEIVABLE', 'COBRANCA'],
  cliente: ['CLIENTE', 'CLI_', 'CUSTOMER', 'TOMADOR'],
  fornecedor: ['FORNECEDOR', 'FORN_', 'SUPPLIER', 'PARCEIRO'],
  manifesto: ['MANIFESTO', 'MDF', 'MDFE'],
  entrega: ['ENTREGA', 'ENT_', 'DELIVERY', 'ROMANEIO'],
  ocorrencia: ['OCORRENCIA', 'OCOR', 'INCIDENT'],
  usuario: ['USUARIO', 'USER', 'USR_', 'LOGIN'],
  filial: ['FILIAL', 'FIL_', 'BRANCH', 'UNIDADE'],
  agregado: ['AGREGADO', 'AGR_', 'TERCEIRO'],
  cadastro: ['CADASTRO', 'CAD_', 'REGISTRO']
};

export const SERVER_INFO = {
  name: 'ssw-erp-mcp-server',
  version: '1.0.0',
  description: 'MCP Server para exploração do ERP SSW da BBT Transportes'
};
