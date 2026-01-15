import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout';
import { DollarSign, TrendingUp, Activity, Wallet, ArrowUpRight, ArrowDownRight, BarChart3, GripVertical } from 'lucide-react';

interface KpiData {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'purple' | 'red';
  subtitle?: string;
  route: string;
}

const initialKpis: KpiData[] = [
  {
    id: 'receita',
    title: 'Receita Mensal',
    value: 'R$ 245K',
    change: '+12%',
    changeType: 'positive',
    icon: <DollarSign className="h-6 w-6 text-white" />,
    color: 'emerald',
    route: '/dashboard/kpi/receita'
  },
  {
    id: 'entregas',
    title: 'Entregas do Mês',
    value: '342',
    change: '+8%',
    changeType: 'positive',
    icon: <TrendingUp className="h-6 w-6 text-white" />,
    color: 'blue',
    route: '/dashboard/kpi/entregas'
  },
  {
    id: 'eficiencia',
    title: 'Eficiência',
    value: '96.5%',
    change: '+2.3%',
    changeType: 'positive',
    icon: <Activity className="h-6 w-6 text-white" />,
    color: 'purple',
    route: '/dashboard/kpi/eficiencia'
  },
  {
    id: 'custos',
    title: 'Custos',
    value: 'R$ 98K',
    change: '+5%',
    changeType: 'negative',
    icon: <Wallet className="h-6 w-6 text-white" />,
    color: 'red',
    route: '/dashboard/kpi/custos'
  }
];

interface KanbanCardProps {
  kpi: KpiData;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  isDragging: boolean;
  dragOverIndex: number | null;
  onViewDetails: (route: string) => void;
}

function KanbanCard({
  kpi,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  dragOverIndex,
  onViewDetails
}: KanbanCardProps) {
  const colorStyles = {
    emerald: {
      gradient: 'from-emerald-500 to-emerald-700',
      shadow: 'shadow-emerald-500/30',
      hoverBorder: 'hover:border-emerald-500/30',
      dropIndicator: 'border-emerald-500',
    },
    blue: {
      gradient: 'from-benfica-blue to-blue-700',
      shadow: 'shadow-benfica-blue/30',
      hoverBorder: 'hover:border-benfica-blue/30',
      dropIndicator: 'border-benfica-blue',
    },
    purple: {
      gradient: 'from-purple-500 to-purple-700',
      shadow: 'shadow-purple-500/30',
      hoverBorder: 'hover:border-purple-500/30',
      dropIndicator: 'border-purple-500',
    },
    red: {
      gradient: 'from-benfica-red to-red-700',
      shadow: 'shadow-benfica-red/30',
      hoverBorder: 'hover:border-benfica-red/30',
      dropIndicator: 'border-red-500',
    },
  };

  const styles = colorStyles[kpi.color];
  const isDropTarget = dragOverIndex === index;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      className={`
        bg-white/5 backdrop-blur-xl rounded-2xl border transition-all duration-300 flex flex-col h-full
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        ${isDropTarget ? `border-2 ${styles.dropIndicator} bg-white/10` : 'border-white/10'}
        ${styles.hoverBorder} hover:bg-white/10 
        cursor-grab active:cursor-grabbing
      `}
    >
      {/* Kanban Header com Drag Handle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/3 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-500 cursor-grab active:cursor-grabbing" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.title}</span>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${kpi.changeType === 'positive'
            ? 'text-emerald-400 bg-emerald-500/10'
            : 'text-red-400 bg-red-500/10'
          }`}>
          {kpi.changeType === 'positive' ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {kpi.change}
        </div>
      </div>

      {/* Kanban Content */}
      <div className="p-5 flex-1 flex flex-col justify-center">
        <div className="flex items-start gap-4">
          <div className={`p-3 bg-gradient-to-br ${styles.gradient} rounded-xl shadow-lg ${styles.shadow} border border-white/10 shrink-0`}>
            {kpi.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-4xl font-black text-white truncate">{kpi.value}</p>
            <p className="text-xs text-slate-500 mt-1">{kpi.subtitle || 'vs mês anterior'}</p>
          </div>
        </div>
      </div>

      {/* Kanban Footer - Quick Actions */}
      <div className="px-4 py-3 border-t border-white/5 bg-white/3 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Atualizado agora</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(kpi.route);
            }}
            className="text-xs text-benfica-blue hover:text-benfica-blue/80 font-medium transition-colors hover:underline"
          >
            Ver detalhes →
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardGestao() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KpiData[]>(initialKpis);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newKpis = [...kpis];
    const [draggedItem] = newKpis.splice(draggedIndex, 1);
    newKpis.splice(dropIndex, 0, draggedItem);

    setKpis(newKpis);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleViewDetails = (route: string) => {
    navigate(route);
  };

  return (
    <Container>
      <div className="space-y-6" onDragEnd={handleDragEnd}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-benfica-blue/30 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-2.5 bg-gradient-to-br from-benfica-blue to-blue-700 rounded-xl shadow-lg shadow-benfica-blue/30 border border-white/20">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
              Dashboard Gestão
            </h1>
            <p className="mt-2 text-slate-400 font-medium">
              Visão gerencial e indicadores de performance
            </p>
          </div>
        </div>

        {/* Kanban Board - KPIs */}
        <div className="bg-white/3 backdrop-blur-sm rounded-3xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1 bg-gradient-to-b from-emerald-500 to-benfica-blue rounded-full" />
            <h2 className="text-lg font-bold text-white">Indicadores Principais</h2>
            <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-lg">KPIs do Mês</span>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg ml-auto">
              ✓ Arraste para reorganizar
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => (
              <KanbanCard
                key={kpi.id}
                kpi={kpi}
                index={index}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragging={draggedIndex === index}
                dragOverIndex={dragOverIndex}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>

        {/* Grid de análises - Dark Glass Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Principais Rotas */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 bg-slate-900/30 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Principais Rotas</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                <div>
                  <p className="font-semibold text-white">Goiânia → São Paulo</p>
                  <p className="text-sm text-slate-400">BR-153</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400">156 viagens</p>
                  <p className="text-xs text-slate-500">este mês</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                <div>
                  <p className="font-semibold text-white">Goiânia → Brasília</p>
                  <p className="text-sm text-slate-400">BR-060</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-benfica-blue">89 viagens</p>
                  <p className="text-xs text-slate-500">este mês</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                <div>
                  <p className="font-semibold text-white">Goiânia → Cuiabá</p>
                  <p className="text-sm text-slate-400">BR-070</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-400">67 viagens</p>
                  <p className="text-xs text-slate-500">este mês</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance da Frota */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 bg-slate-900/30 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Performance da Frota</h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-400">Utilização da Frota</span>
                  <span className="text-sm font-bold text-white">85%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-400">Entregas no Prazo</span>
                  <span className="text-sm font-bold text-white">92%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-benfica-blue to-blue-400 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-400">Satisfação do Cliente</span>
                  <span className="text-sm font-bold text-white">98%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-400">Eficiência de Combustível</span>
                  <span className="text-sm font-bold text-white">78%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
