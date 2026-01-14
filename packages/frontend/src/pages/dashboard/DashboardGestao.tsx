import { Container } from '@/components/layout';
import { BBTMatrixMap } from '@/components/dashboard';
import { DollarSign, TrendingUp, Activity, Wallet, ArrowUpRight, ArrowDownRight, BarChart3, Map } from 'lucide-react';

export function DashboardGestao() {
  return (
    <Container>
      <div className="space-y-6">
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

        {/* KPIs de gestão - Dark Glass Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 - Receita Mensal */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-emerald-500/30 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl shadow-lg shadow-emerald-500/30 border border-white/10">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">
                <ArrowUpRight className="w-4 h-4" />
                +12%
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-400">Receita Mensal</p>
            <p className="text-4xl font-black text-white mt-1">R$ 245K</p>
            <p className="text-xs text-slate-500 mt-2">vs mês anterior</p>
          </div>

          {/* Card 2 - Entregas no Mês */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-benfica-blue/30 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-benfica-blue to-blue-700 rounded-xl shadow-lg shadow-benfica-blue/30 border border-white/10">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">
                <ArrowUpRight className="w-4 h-4" />
                +8%
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-400">Entregas no Mês</p>
            <p className="text-4xl font-black text-white mt-1">342</p>
            <p className="text-xs text-slate-500 mt-2">vs mês anterior</p>
          </div>

          {/* Card 3 - Eficiência */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg shadow-purple-500/30 border border-white/10">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">
                <ArrowUpRight className="w-4 h-4" />
                +2.3%
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-400">Eficiência</p>
            <p className="text-4xl font-black text-white mt-1">96.5%</p>
            <p className="text-xs text-slate-500 mt-2">vs mês anterior</p>
          </div>

          {/* Card 4 - Custos */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-benfica-red/30 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-benfica-red to-red-700 rounded-xl shadow-lg shadow-benfica-red/30 border border-white/10">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-red-400 text-sm font-bold bg-red-500/10 px-2 py-1 rounded-lg">
                <ArrowDownRight className="w-4 h-4" />
                +5%
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-400">Custos</p>
            <p className="text-4xl font-black text-white mt-1">R$ 98K</p>
            <p className="text-xs text-slate-500 mt-2">vs mês anterior</p>
          </div>
        </div>

        {/* Central de Monitoramento BBT - Live Interactive Map */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-benfica-blue/10 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-benfica-blue rounded-xl shadow-lg border border-white/20">
                  <Map className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Central de Monitoramento BBT</h2>
                  <p className="text-xs text-slate-400">Rastreamento em tempo real da frota</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  LIVE
                </span>
              </div>
            </div>
          </div>
          <BBTMatrixMap className="h-[450px]" />
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

