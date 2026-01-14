import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map as MapIcon, Truck, Wifi, X, User, Package, Phone, MapPin, Route,
  Building2, CircleDot, Gauge, Fuel, Navigation, Maximize2, Minimize2
} from 'lucide-react';
import type {
  Vehicle,
  Coordinate,
  RouteDefinition,
  FleetStats,
} from '@guardiao/shared';
import { BBT_MATRIZ, DEFAULT_STATUS_CONFIG } from '@guardiao/shared';

// ============================================================================
// DADOS DA FROTA BBT (Mock - será substituído por dados reais via API)
// ============================================================================

const fleetData: Vehicle[] = [
  {
    id: '1',
    plate: 'GOI-2B34',
    status: 'active',
    driver: { name: 'Carlos Silva', photo: 'CS', phone: '(62) 99845-1234', cnh: 'E', since: '2019' },
    cargo: { id: 'NF-45892', client: 'Magazine Luiza', origin: 'Goiânia - GO', destination: 'São Paulo - SP', weight: '18.5 ton', eta: '14h30', value: 'R$ 245.000' },
    route: 'GO → SP via BR-153',
    speed: 85,
    fuel: 72,
    routeId: 'route-sp'
  },
  {
    id: '2',
    plate: 'BBT-1C56',
    status: 'active',
    driver: { name: 'Roberto Almeida', photo: 'RA', phone: '(62) 98765-4321', cnh: 'E', since: '2021' },
    cargo: { id: 'NF-45893', client: 'Casas Bahia', origin: 'Aparecida de Goiânia', destination: 'Brasília - DF', weight: '12.3 ton', eta: '16h45', value: 'R$ 178.500' },
    route: 'GO → DF via BR-060',
    speed: 78,
    fuel: 58,
    routeId: 'route-df'
  },
  {
    id: '3',
    plate: 'TRK-7D89',
    status: 'idle',
    driver: { name: 'Marcos Oliveira', photo: 'MO', phone: '(62) 99912-8765', cnh: 'D', since: '2020' },
    cargo: { id: 'NF-45894', client: 'Ambev', origin: 'Anápolis - GO', destination: 'Goiânia - GO', weight: '8.2 ton', eta: 'Aguardando', value: 'R$ 95.200' },
    route: 'Parado - Pátio BBT',
    speed: 0,
    fuel: 45,
    routeId: 'static'
  },
  {
    id: '4',
    plate: 'LOG-9E12',
    status: 'delayed',
    driver: { name: 'José Fernando', photo: 'JF', phone: '(62) 99834-5678', cnh: 'E', since: '2018' },
    cargo: { id: 'NF-45895', client: 'Natura', origin: 'Goiânia - GO', destination: 'Ribeirão Preto', weight: '5.8 ton', eta: 'Atrasado +2h', value: 'R$ 320.800' },
    route: 'Manutenção preventiva',
    speed: 0,
    fuel: 32,
    routeId: 'static'
  },
  {
    id: '5',
    plate: 'FRT-3F45',
    status: 'active',
    driver: { name: 'Paulo Ricardo', photo: 'PR', phone: '(62) 99756-9012', cnh: 'E', since: '2022' },
    cargo: { id: 'NF-45896', client: 'Riachuelo', origin: 'Goiânia - GO', destination: 'Cuiabá - MT', weight: '14.7 ton', eta: '19h00', value: 'R$ 156.300' },
    route: 'GO → MT via BR-070',
    speed: 92,
    fuel: 88,
    routeId: 'route-mt'
  },
  {
    id: '6',
    plate: 'BBT-4G78',
    status: 'active',
    driver: { name: 'Antônio Souza', photo: 'AS', phone: '(62) 99823-4567', cnh: 'E', since: '2020' },
    cargo: { id: 'NF-45897', client: 'Americanas', origin: 'Aparecida', destination: 'Anápolis - GO', weight: '9.4 ton', eta: '11h15', value: 'R$ 112.000' },
    route: 'Aparecida → Anápolis',
    speed: 68,
    fuel: 81,
    routeId: 'route-anapolis'
  },
];

// ============================================================================
// ROTAS REALISTAS (seguindo ruas reais de Goiânia)
// ============================================================================

const routeDefinitions: RouteDefinition[] = [
  {
    id: 'route-sp',
    name: 'Goiânia → São Paulo (BR-153)',
    color: '#10b981',
    waypoints: [
      BBT_MATRIZ,
      { lat: -16.8180, lng: -49.2350 },
      { lat: -16.8050, lng: -49.2280 },
      { lat: -16.7850, lng: -49.2200 },
      { lat: -16.7650, lng: -49.2100 },
      { lat: -16.7400, lng: -49.1950 },
      { lat: -16.7100, lng: -49.1800 },
      { lat: -16.6800, lng: -49.1600 },
    ]
  },
  {
    id: 'route-df',
    name: 'Goiânia → Brasília (BR-060)',
    color: '#3b82f6',
    waypoints: [
      BBT_MATRIZ,
      { lat: -16.8100, lng: -49.2500 },
      { lat: -16.7900, lng: -49.2600 },
      { lat: -16.7600, lng: -49.2700 },
      { lat: -16.7200, lng: -49.2550 },
      { lat: -16.6900, lng: -49.2400 },
      { lat: -16.6500, lng: -49.2200 },
      { lat: -16.6000, lng: -49.2000 },
    ]
  },
  {
    id: 'route-mt',
    name: 'Goiânia → Cuiabá (BR-070)',
    color: '#f59e0b',
    waypoints: [
      BBT_MATRIZ,
      { lat: -16.8200, lng: -49.2600 },
      { lat: -16.8100, lng: -49.2800 },
      { lat: -16.7950, lng: -49.3000 },
      { lat: -16.7700, lng: -49.3200 },
      { lat: -16.7400, lng: -49.3400 },
      { lat: -16.7100, lng: -49.3600 },
      { lat: -16.6800, lng: -49.3900 },
    ]
  },
  {
    id: 'route-anapolis',
    name: 'Aparecida → Anápolis (BR-153 Norte)',
    color: '#8b5cf6',
    waypoints: [
      BBT_MATRIZ,
      { lat: -16.8100, lng: -49.2380 },
      { lat: -16.7800, lng: -49.2300 },
      { lat: -16.7400, lng: -49.2200 },
      { lat: -16.7000, lng: -49.2100 },
      { lat: -16.6500, lng: -49.2000 },
      { lat: -16.6000, lng: -49.1900 },
      { lat: -16.5500, lng: -49.1800 },
    ]
  },
];

// ============================================================================
// UTILITÁRIOS DE INTERPOLAÇÃO DE ROTA
// ============================================================================

function interpolatePosition(waypoints: Coordinate[], progress: number): Coordinate {
  if (waypoints.length < 2) return waypoints[0] || BBT_MATRIZ;

  const totalSegments = waypoints.length - 1;
  const segmentProgress = progress * totalSegments;
  const currentSegment = Math.min(Math.floor(segmentProgress), totalSegments - 1);
  const segmentT = segmentProgress - currentSegment;

  const start = waypoints[currentSegment];
  const end = waypoints[currentSegment + 1];

  return {
    lat: start.lat + (end.lat - start.lat) * segmentT,
    lng: start.lng + (end.lng - start.lng) * segmentT,
  };
}

function calculateBearing(from: Coordinate, to: Coordinate): number {
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// ============================================================================
// COMPONENTE: PAINEL DE INFORMAÇÕES DO VEÍCULO
// ============================================================================

interface InfoPanelProps {
  vehicle: Vehicle;
  onClose: () => void;
}

function InfoPanel({ vehicle, onClose }: InfoPanelProps) {
  const config = DEFAULT_STATUS_CONFIG[vehicle.status as keyof typeof DEFAULT_STATUS_CONFIG];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute top-0 right-0 w-64 h-full bg-slate-950/98 backdrop-blur-xl border-l border-white/10 overflow-y-auto z-[1000]"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bg} shadow-lg`}>
              <Truck className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-base">{vehicle.plate}</div>
              <div className="text-xs font-medium" style={{ color: config.color }}>{config.label}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800/60 rounded-lg p-2 text-center">
            <Gauge className="h-3 w-3 text-cyan-400 mx-auto mb-1" />
            <div className="text-cyan-400 text-sm font-bold">{vehicle.speed}</div>
            <div className="text-[10px] text-slate-500">km/h</div>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-2 text-center">
            <Fuel className="h-3 w-3 text-yellow-400 mx-auto mb-1" />
            <div className="text-yellow-400 text-sm font-bold">{vehicle.fuel}%</div>
            <div className="text-[10px] text-slate-500">Comb.</div>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-2 text-center">
            <MapPin className="h-3 w-3 text-emerald-400 mx-auto mb-1" />
            <div className="text-emerald-400 text-sm font-bold">{vehicle.cargo.eta}</div>
            <div className="text-[10px] text-slate-500">ETA</div>
          </div>
        </div>
      </div>

      {/* Motorista */}
      <div className="p-4 border-b border-white/5">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <User className="h-3 w-3" />
          Motorista
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold shadow-lg">
            {vehicle.driver.photo}
          </div>
          <div>
            <div className="text-white text-sm font-medium">{vehicle.driver.name}</div>
            <div className="text-slate-400 text-[10px]">CNH {vehicle.driver.cnh} - Desde {vehicle.driver.since}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-300 bg-slate-800/40 rounded-lg px-3 py-1.5">
          <Phone className="h-3 w-3 text-emerald-400" />
          {vehicle.driver.phone}
        </div>
      </div>

      {/* Carga */}
      <div className="p-4">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Package className="h-3 w-3" />
          Carga
        </div>
        <div className="space-y-2 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500">NF</span>
            <span className="text-white font-mono">{vehicle.cargo.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Cliente</span>
            <span className="text-cyan-400 font-medium">{vehicle.cargo.client}</span>
          </div>

          {/* Origem/Destino */}
          <div className="bg-slate-800/50 rounded-lg p-3 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <CircleDot className="h-3 w-3 text-emerald-400 flex-shrink-0" />
              <span className="text-white text-xs">{vehicle.cargo.origin}</span>
            </div>
            <div className="border-l-2 border-dashed border-slate-600 h-3 ml-1.5" />
            <div className="flex items-center gap-2 mt-2">
              <MapPin className="h-3 w-3 text-red-400 flex-shrink-0" />
              <span className="text-white text-xs">{vehicle.cargo.destination}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <div className="text-[9px] text-slate-500">Peso</div>
              <div className="text-white font-medium">{vehicle.cargo.weight}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <div className="text-[9px] text-slate-500">Valor</div>
              <div className="text-emerald-400 font-medium">{vehicle.cargo.value}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rota */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <Route className="h-3 w-3 text-blue-400" />
          {vehicle.route}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// COMPONENTE: MARCADOR DO VEÍCULO
// ============================================================================

interface VehicleMarkerProps {
  vehicle: Vehicle;
  position: Coordinate;
  bearing: number;
  isSelected: boolean;
  onClick: () => void;
  mapBounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}

function VehicleMarker({
  vehicle,
  position,
  bearing,
  isSelected,
  onClick,
  mapBounds
}: VehicleMarkerProps) {
  const config = DEFAULT_STATUS_CONFIG[vehicle.status as keyof typeof DEFAULT_STATUS_CONFIG];

  // Converter lat/lng para posição no container (0-100%)
  const x = ((position.lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
  const y = ((mapBounds.maxLat - position.lat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;

  // Verificar se está dentro dos limites
  if (x < 0 || x > 100 || y < 0 || y > 100) return null;

  return (
    <motion.div
      className="absolute cursor-pointer z-[500] group"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      animate={{
        left: `${x}%`,
        top: `${y}%`
      }}
      transition={{ duration: 0.5, ease: 'linear' }}
      onClick={onClick}
    >
      {/* Pulse animation para veículos ativos */}
      {vehicle.status === 'active' && (
        <div
          className="absolute rounded-full animate-ping"
          style={{
            backgroundColor: config.color,
            width: 28,
            height: 28,
            left: -6,
            top: -6,
            opacity: 0.4
          }}
        />
      )}

      {/* Ícone do veículo */}
      <div
        className={`
          flex items-center justify-center h-6 w-6 rounded-full
          ${config.bg} border-2 border-white shadow-xl
          ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
          transition-all hover:scale-110
        `}
        style={{
          transform: `rotate(${bearing - 90}deg)`,
        }}
      >
        <Navigation className="h-3 w-3 text-white" style={{ transform: `rotate(90deg)` }} />
      </div>

      {/* Tooltip com placa */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-slate-900 border border-white/20 px-2 py-1 rounded-lg shadow-xl">
          <span className="text-[10px] text-white font-bold whitespace-nowrap">{vehicle.plate}</span>
          <div className="text-[8px] text-slate-400">{vehicle.speed} km/h</div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// COMPONENTE: MAPA ESTILIZADO (SVG)
// ============================================================================

interface StylizedMapProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (v: Vehicle) => void;
  vehiclePositions: globalThis.Map<string, Coordinate>;
  vehicleBearings: globalThis.Map<string, number>;
}

function StylizedMap({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  vehiclePositions,
  vehicleBearings,
}: StylizedMapProps) {
  // Bounds do mapa (Goiânia/Aparecida de Goiânia)
  const mapBounds = {
    minLat: -16.88,
    maxLat: -16.58,
    minLng: -49.42,
    maxLng: -49.12,
  };

  // Converter coordenadas para posição no SVG
  const toSvgCoords = (coord: Coordinate) => ({
    x: ((coord.lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 800,
    y: ((mapBounds.maxLat - coord.lat) / (mapBounds.maxLat - mapBounds.minLat)) * 450,
  });

  const matrizPos = toSvgCoords(BBT_MATRIZ);

  return (
    <div className="relative w-full h-full bg-slate-800 overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 450"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" opacity="0.5" />
          </pattern>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <rect width="800" height="450" fill="url(#bgGrad)" />
        <rect width="800" height="450" fill="url(#gridPattern)" />

        {/* Principais vias de Goiânia */}
        {/* Av. Anhanguera (horizontal principal) */}
        <path
          d="M 0 200 Q 200 195 400 200 T 800 190"
          fill="none"
          stroke="#475569"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 0 200 Q 200 195 400 200 T 800 190"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="1"
          strokeDasharray="20 15"
          opacity="0.6"
        />

        {/* BR-153 (diagonal sudeste) */}
        <path
          d="M 380 350 Q 450 280 520 220 T 700 80"
          fill="none"
          stroke="#64748b"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 380 350 Q 450 280 520 220 T 700 80"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="1.5"
          strokeDasharray="25 15"
          opacity="0.7"
        />

        {/* BR-060 (sentido norte/Brasília) */}
        <path
          d="M 350 380 Q 400 300 420 220 T 500 50"
          fill="none"
          stroke="#64748b"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* BR-070 (sentido oeste/Cuiabá) */}
        <path
          d="M 350 220 Q 250 210 150 220 T 0 250"
          fill="none"
          stroke="#64748b"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Av. Rio Verde */}
        <path
          d="M 300 420 L 450 280"
          fill="none"
          stroke="#475569"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Avenidas secundárias */}
        <rect x="180" y="0" width="8" height="450" fill="#3f4f63" rx="2" />
        <rect x="320" y="0" width="8" height="450" fill="#3f4f63" rx="2" />
        <rect x="480" y="0" width="8" height="450" fill="#3f4f63" rx="2" />
        <rect x="620" y="0" width="8" height="450" fill="#3f4f63" rx="2" />

        <rect x="0" y="100" width="800" height="8" fill="#3f4f63" rx="2" />
        <rect x="0" y="300" width="800" height="8" fill="#3f4f63" rx="2" />

        {/* Áreas verdes (parques) */}
        <ellipse cx="120" cy="80" rx="45" ry="35" fill="#166534" opacity="0.4" />
        <ellipse cx="650" cy="350" rx="55" ry="40" fill="#166534" opacity="0.4" />
        <ellipse cx="250" cy="380" rx="40" ry="30" fill="#166534" opacity="0.4" />

        {/* Shopping centers */}
        <rect x="550" y="150" width="50" height="35" fill="#4b5563" rx="4" />
        <text x="575" y="172" textAnchor="middle" fill="#94a3b8" fontSize="8">Shopping</text>

        <rect x="200" y="120" width="45" height="30" fill="#4b5563" rx="4" />
        <rect x="420" y="280" width="40" height="28" fill="#4b5563" rx="4" />

        {/* Rotas dos veículos ativos */}
        {routeDefinitions.map((route) => {
          const pathPoints = route.waypoints.map(toSvgCoords);
          const pathD = pathPoints.reduce((acc, point, i) => {
            if (i === 0) return `M ${point.x} ${point.y}`;
            return `${acc} Q ${pathPoints[i - 1].x + (point.x - pathPoints[i - 1].x) * 0.3} ${pathPoints[i - 1].y + (point.y - pathPoints[i - 1].y) * 0.3} ${point.x} ${point.y}`;
          }, '');

          return (
            <g key={route.id}>
              <path
                d={pathD}
                fill="none"
                stroke={route.color}
                strokeWidth="4"
                strokeDasharray="12 6"
                opacity="0.5"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-36"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
          );
        })}

        {/* Matriz BBT */}
        <g transform={`translate(${matrizPos.x}, ${matrizPos.y})`} filter="url(#glow)">
          <circle r="35" fill="#dc2626" opacity="0.2">
            <animate attributeName="r" values="35;45;35" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle r="25" fill="#dc2626" opacity="0.3">
            <animate attributeName="r" values="25;32;25" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle r="18" fill="#dc2626" stroke="white" strokeWidth="3" />
          <text x="0" y="1" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">BBT</text>
          <text x="0" y="38" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" className="drop-shadow-lg">
            MATRIZ
          </text>
          <text x="0" y="50" textAnchor="middle" fill="#94a3b8" fontSize="8">
            Jd. Atlântico
          </text>
        </g>

        {/* Labels das vias */}
        <text x="600" y="185" fill="#94a3b8" fontSize="10" fontWeight="500">Av. Anhanguera</text>
        <text x="620" y="100" fill="#94a3b8" fontSize="10" fontWeight="500">BR-153</text>
        <text x="460" y="70" fill="#94a3b8" fontSize="10" fontWeight="500">BR-060</text>
        <text x="60" y="235" fill="#94a3b8" fontSize="10" fontWeight="500">BR-070</text>
        <text x="350" y="370" fill="#94a3b8" fontSize="9">Av. Rio Verde</text>

        {/* Indicadores de direção */}
        <text x="750" y="95" fill="#64748b" fontSize="9">São Paulo</text>
        <text x="480" y="35" fill="#64748b" fontSize="9">Brasília</text>
        <text x="15" y="265" fill="#64748b" fontSize="9">Cuiabá</text>

        {/* Goiânia label */}
        <text x="400" y="200" textAnchor="middle" fill="#e2e8f0" fontSize="22" fontWeight="bold" opacity="0.15">
          GOIÂNIA
        </text>
      </svg>

      {/* Vehicle markers (rendered as HTML for better interactivity) */}
      {vehicles.map((vehicle) => {
        const position = vehiclePositions.get(vehicle.id);
        const bearing = vehicleBearings.get(vehicle.id) || 0;
        if (!position) return null;

        return (
          <VehicleMarker
            key={vehicle.id}
            vehicle={vehicle}
            position={position}
            bearing={bearing}
            isSelected={selectedVehicle?.id === vehicle.id}
            onClick={() => onSelectVehicle(vehicle)}
            mapBounds={mapBounds}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL: FLEET MAP WIDGET
// ============================================================================

export interface FleetMapWidgetProps {
  className?: string;
  vehicles?: Vehicle[];
}

// Tipo local para evitar conflito com o ícone Map
type ProgressMap = globalThis.Map<string, number>;
type PositionMap = globalThis.Map<string, Coordinate>;

export function FleetMapWidget({ className, vehicles = fleetData }: FleetMapWidgetProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [animationProgress, setAnimationProgress] = useState<ProgressMap>(new globalThis.Map());
  const [isExpanded, setIsExpanded] = useState(false);

  // Inicializar progresso de animação para cada veículo
  useEffect(() => {
    const initialProgress: ProgressMap = new globalThis.Map();
    vehicles.forEach((v, index) => {
      // Offset diferente para cada veículo para variedade
      initialProgress.set(v.id, (index * 15) % 100);
    });
    setAnimationProgress(initialProgress);
  }, [vehicles]);

  // Animar veículos ao longo das rotas
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationProgress(prev => {
        const next: ProgressMap = new globalThis.Map(prev);
        vehicles.forEach(vehicle => {
          if (vehicle.status === 'active') {
            const current = next.get(vehicle.id) || 0;
            // Velocidade variável baseada na velocidade do veículo
            const speed = (vehicle.speed / 100) * 0.8;
            next.set(vehicle.id, (current + speed) % 100);
          }
        });
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [vehicles]);

  // Calcular posições dos veículos
  const vehiclePositions = useMemo(() => {
    const positions: PositionMap = new globalThis.Map();

    vehicles.forEach(vehicle => {
      if (vehicle.status !== 'active') {
        // Veículos parados ficam na matriz com pequeno offset
        const offset = parseInt(vehicle.id) * 0.001;
        positions.set(vehicle.id, {
          lat: BBT_MATRIZ.lat + offset,
          lng: BBT_MATRIZ.lng + offset * 1.5,
        });
      } else {
        const route = routeDefinitions.find(r => r.id === vehicle.routeId);
        if (route) {
          const progress = (animationProgress.get(vehicle.id) || 0) / 100;
          positions.set(vehicle.id, interpolatePosition(route.waypoints, progress));
        }
      }
    });

    return positions;
  }, [animationProgress, vehicles]);

  // Calcular direção dos veículos
  const vehicleBearings = useMemo(() => {
    const bearings: ProgressMap = new globalThis.Map();

    vehicles.forEach(vehicle => {
      if (vehicle.status === 'active') {
        const route = routeDefinitions.find(r => r.id === vehicle.routeId);
        if (route && route.waypoints.length >= 2) {
          const progress = (animationProgress.get(vehicle.id) || 0) / 100;
          const currentPos = interpolatePosition(route.waypoints, progress);
          const nextPos = interpolatePosition(route.waypoints, Math.min(progress + 0.05, 1));
          bearings.set(vehicle.id, calculateBearing(currentPos, nextPos));
        }
      } else {
        bearings.set(vehicle.id, 0);
      }
    });

    return bearings;
  }, [animationProgress, vehicles]);

  // Estatísticas
  const stats: FleetStats = {
    active: vehicles.filter(v => v.status === 'active').length,
    idle: vehicles.filter(v => v.status === 'idle').length,
    delayed: vehicles.filter(v => v.status === 'delayed').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    offline: vehicles.filter(v => v.status === 'offline').length,
    total: vehicles.length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`col-span-full ${className || ''}`}
    >
      <Card className="overflow-hidden bg-slate-900 border-slate-700/50">
        <CardHeader className="pb-2 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <MapIcon className="h-5 w-5 text-cyan-400" />
              Central de Monitoramento - Frota BBT
              <span className="flex items-center gap-1 ml-2">
                <Wifi className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-normal">Online</span>
              </span>
            </CardTitle>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                  {stats.active} em trânsito
                </span>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-medium">
                  {stats.idle} parados
                </span>
                <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 font-medium">
                  {stats.delayed} atrasados
                </span>
              </div>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4 text-slate-400" />
                ) : (
                  <Maximize2 className="h-4 w-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 bg-slate-900">
          <div
            className={`
              relative rounded-xl overflow-hidden border border-white/10
              transition-all duration-300
              ${isExpanded ? 'h-[500px]' : 'h-80'}
            `}
          >
            <StylizedMap
              vehicles={vehicles}
              selectedVehicle={selectedVehicle}
              onSelectVehicle={setSelectedVehicle}
              vehiclePositions={vehiclePositions}
              vehicleBearings={vehicleBearings}
            />

            {/* Info Panel */}
            <AnimatePresence>
              {selectedVehicle && (
                <InfoPanel
                  vehicle={selectedVehicle}
                  onClose={() => setSelectedVehicle(null)}
                />
              )}
            </AnimatePresence>

            {/* Live indicator */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-full z-20 border border-white/10">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <span className="text-white text-[10px] font-medium tracking-wide">RASTREAMENTO AO VIVO</span>
            </div>

            {/* Zoom controls placeholder */}
            <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-20">
              <button className="w-8 h-8 bg-slate-900/90 backdrop-blur rounded-lg border border-white/10 text-white text-lg hover:bg-slate-800 transition-colors">
                +
              </button>
              <button className="w-8 h-8 bg-slate-900/90 backdrop-blur rounded-lg border border-white/10 text-white text-lg hover:bg-slate-800 transition-colors">
                -
              </button>
            </div>
          </div>

          {/* Footer info */}
          <div className="mt-3 flex items-center justify-between text-[10px]">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-red-400" />
              <span className="font-medium text-slate-400">BBT Transportes</span>
              <span className="text-slate-600">-</span>
              <span className="text-slate-500">Jardim Atlântico - Aparecida de Goiânia/GO</span>
            </span>
            <span className="text-emerald-400 flex items-center gap-2">
              <span>{stats.total} veículos monitorados</span>
              <span className="text-slate-600">-</span>
              <span>Atualização em tempo real</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default FleetMapWidget;
