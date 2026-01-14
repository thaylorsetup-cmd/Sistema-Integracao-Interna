/**
 * Tipos relacionados à frota e monitoramento de veículos
 * Importados do SaaS BBT True e adaptados para o Guardião V2
 */

// ============================================================================
// TIPOS BASE - LOCALIZAÇÃO
// ============================================================================

export interface Coordinate {
  lat: number;
  lng: number;
}

// ============================================================================
// TIPOS - MOTORISTA
// ============================================================================

export interface Driver {
  name: string;
  photo: string;
  phone: string;
  cnh: string;
  since: string;
}

// ============================================================================
// TIPOS - CARGA
// ============================================================================

export interface Cargo {
  id: string;
  client: string;
  origin: string;
  destination: string;
  weight: string;
  eta: string;
  value: string;
}

// ============================================================================
// TIPOS - VEÍCULO
// ============================================================================

export type VehicleStatus = 'active' | 'idle' | 'delayed' | 'maintenance' | 'offline';

export interface Vehicle {
  id: string;
  plate: string;
  status: VehicleStatus;
  driver: Driver;
  cargo: Cargo;
  route: string;
  speed: number;
  fuel: number;
  routeId: string;
}

// ============================================================================
// TIPOS - ROTAS
// ============================================================================

export interface RouteDefinition {
  id: string;
  name: string;
  color: string;
  waypoints: Coordinate[];
}

// ============================================================================
// TIPOS - CONFIGURAÇÃO DE STATUS
// ============================================================================

export interface StatusConfig {
  color: string;
  bg: string;
  label: string;
  markerClass: string;
}

export type StatusConfigMap = Record<VehicleStatus, StatusConfig>;

// ============================================================================
// TIPOS - ESTATÍSTICAS DA FROTA
// ============================================================================

export interface FleetStats {
  active: number;
  idle: number;
  delayed: number;
  maintenance: number;
  offline: number;
  total: number;
}

// ============================================================================
// CONSTANTES - LOCALIZAÇÃO BBT
// ============================================================================

export const BBT_MATRIZ: Coordinate = {
  lat: -16.8247,
  lng: -49.2432
};

// ============================================================================
// CONSTANTES - CONFIGURAÇÃO DE STATUS
// ============================================================================

export const DEFAULT_STATUS_CONFIG: StatusConfigMap = {
  active: {
    color: '#10b981',
    bg: 'bg-emerald-500',
    label: 'Em Trânsito',
    markerClass: 'pulse-green'
  },
  idle: {
    color: '#3b82f6',
    bg: 'bg-blue-500',
    label: 'Parado',
    markerClass: ''
  },
  delayed: {
    color: '#ef4444',
    bg: 'bg-red-500',
    label: 'Atrasado',
    markerClass: 'pulse-red'
  },
  maintenance: {
    color: '#f59e0b',
    bg: 'bg-amber-500',
    label: 'Manutenção',
    markerClass: ''
  },
  offline: {
    color: '#6b7280',
    bg: 'bg-gray-500',
    label: 'Offline',
    markerClass: ''
  },
};
