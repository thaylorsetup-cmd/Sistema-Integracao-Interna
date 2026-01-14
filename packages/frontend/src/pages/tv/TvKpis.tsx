import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoBackground } from '@/components/ui';
import {
    Truck,
    Package,
    Clock,
    TrendingUp,
    DollarSign,
    CheckCircle,
    AlertTriangle,
    Activity,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    ArrowLeft
} from 'lucide-react';

interface KpiCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    change?: string;
    changeType?: 'up' | 'down' | 'neutral';
    color: string;
}

function KpiCard({ icon: Icon, label, value, change, changeType, color }: KpiCardProps) {
    const colorClasses = {
        blue: 'from-benfica-blue to-blue-700 shadow-benfica-blue/30 border-benfica-blue/30',
        emerald: 'from-emerald-500 to-emerald-700 shadow-emerald-500/30 border-emerald-500/30',
        red: 'from-benfica-red to-red-700 shadow-benfica-red/30 border-benfica-red/30',
        amber: 'from-amber-500 to-orange-600 shadow-amber-500/30 border-amber-500/30',
        purple: 'from-purple-500 to-purple-700 shadow-purple-500/30 border-purple-500/30',
    };

    return (
        <div className={`bg-slate-950/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:${colorClasses[color as keyof typeof colorClasses].split(' ')[2]} transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-4 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-xl shadow-lg border border-white/10`}>
                    <Icon className="h-8 w-8 text-white" />
                </div>
                {change && (
                    <div className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${changeType === 'up' ? 'text-emerald-400 bg-emerald-500/10' :
                        changeType === 'down' ? 'text-red-400 bg-red-500/10' :
                            'text-slate-400 bg-slate-500/10'
                        }`}>
                        {changeType === 'up' && <ArrowUpRight className="w-4 h-4" />}
                        {changeType === 'down' && <ArrowDownRight className="w-4 h-4" />}
                        {change}
                    </div>
                )}
            </div>
            <p className="text-sm text-slate-400 font-medium mb-1">{label}</p>
            <p className="text-5xl font-black text-white">{value}</p>
        </div>
    );
}

export function TvKpis() {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-white font-sans">
            <VideoBackground
                videoSrc="/bbt-background-optimized.webm"
                fallbackToAnimated={true}
            />

            <div className="relative z-10 min-h-screen p-6">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-slate-950/70 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                            {/* Botão Voltar */}
                            <button
                                onClick={() => navigate('/tv')}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10"
                                title="Voltar"
                            >
                                <ArrowLeft className="w-5 h-5 text-white" />
                            </button>
                            <div className="relative">
                                <div className="absolute -inset-1 bg-benfica-red/30 rounded-lg blur opacity-60"></div>
                                <div className="relative w-12 h-12 bg-gradient-to-br from-benfica-red to-red-700 rounded-lg flex items-center justify-center shadow-lg border border-white/20">
                                    <span className="text-white font-black text-lg">BBT</span>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                                    <Activity className="w-6 h-6 text-emerald-400" />
                                    Dashboard de Performance
                                </h1>
                                <p className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Métricas em Tempo Real
                                </p>
                            </div>
                        </div>

                        <div className="text-right bg-slate-900/50 backdrop-blur-xl rounded-lg px-4 py-2 border border-white/10">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-benfica-blue" />
                                <span className="text-2xl font-mono font-bold text-white">
                                    {currentTime.toLocaleTimeString('pt-BR')}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </p>
                        </div>
                    </div>

                    {/* KPIs Grid - Large for TV */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <KpiCard
                            icon={Truck}
                            label="Frota Ativa"
                            value="24"
                            change="+3"
                            changeType="up"
                            color="blue"
                        />
                        <KpiCard
                            icon={Package}
                            label="Entregas Hoje"
                            value="47"
                            change="+12%"
                            changeType="up"
                            color="emerald"
                        />
                        <KpiCard
                            icon={DollarSign}
                            label="Faturamento"
                            value="R$89K"
                            change="+8%"
                            changeType="up"
                            color="purple"
                        />
                        <KpiCard
                            icon={Clock}
                            label="Tempo Médio"
                            value="4.2h"
                            change="-15min"
                            changeType="up"
                            color="amber"
                        />
                    </div>

                    {/* Second Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <KpiCard
                            icon={CheckCircle}
                            label="Taxa de Sucesso"
                            value="98.5%"
                            change="+0.5%"
                            changeType="up"
                            color="emerald"
                        />
                        <KpiCard
                            icon={TrendingUp}
                            label="Eficiência"
                            value="96.2%"
                            change="+2.1%"
                            changeType="up"
                            color="blue"
                        />
                        <KpiCard
                            icon={AlertTriangle}
                            label="Alertas Ativos"
                            value="3"
                            change="-2"
                            changeType="up"
                            color="red"
                        />
                        <KpiCard
                            icon={Package}
                            label="Em Trânsito"
                            value="18"
                            color="amber"
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-center gap-6 bg-slate-950/40 backdrop-blur-xl rounded-xl p-3 border border-white/10">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <span className="text-sm text-slate-400 font-medium">Sistema Online</span>
                        </div>
                        <div className="h-4 w-px bg-white/10"></div>
                        <span className="text-sm text-slate-500">Atualização automática a cada 30s</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
