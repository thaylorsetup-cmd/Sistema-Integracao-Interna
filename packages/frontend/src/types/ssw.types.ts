/**
 * Tipos para integração com a API SSW-HELPER
 * Consulta de motoristas via função ssw0028
 */

// Dados do veículo associado ao motorista
export interface VehicleData {
  placa: string;
  tipo: 'cavalo' | 'carreta' | 'outro';
  renavam?: string;
  antt?: string;
  situacao: 'ativo' | 'inativo' | 'pendente';
}

// Dados do motorista retornados pelo SSW
export interface DriverData {
  cpf: string;
  nome: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  situacao: 'ativo' | 'inativo' | 'pendente' | 'bloqueado';
  dataCadastro?: string;
  
  // Dados da CNH
  numeroCNH?: string;
  categoriaCNH?: string;
  vencimentoCNH?: string;
  cnhValida?: boolean;
  
  // Veículos associados
  veiculosAssociados?: VehicleData[];
  
  // Metadados
  ultimaAtualizacao?: string;
  fonte: 'ssw';
}

// Resposta da API SSW-HELPER
export interface SSWApiResponse<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

// Status de autenticação
export interface SSWAuthStatus {
  authenticated: boolean;
  user?: string;
  sessionExpiry?: string;
}

// Estado da consulta de motorista
export interface DriverSearchState {
  isLoading: boolean;
  data: DriverData | null;
  error: string | null;
  lastSearchedCPF: string | null;
}

// Comparação de dados (para Dashboard Cadastro GR)
export interface DataComparison {
  field: string;
  label: string;
  submittedValue: string | undefined;
  sswValue: string | undefined;
  matches: boolean;
}
