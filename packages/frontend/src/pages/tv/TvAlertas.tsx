import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoBackground } from '@/components/ui';
import {
    Clock,
    AlertTriangle,
    AlertCircle,
    Info,
    CheckCircle,
    XCircle,
    Bell,
    Sparkles,
    MapPin,
    Truck,
    ArrowLeft
} from 'lucide-react';

interface Alerta {
    id: string;
    tipo: 'critico' | 'alerta' | 'info' | 'sucesso';
    titulo: string;
    mensagem: string;
    veiculo?: string;
    localizacao?: string;
    timestamp: Date;
}

const MOCK_ALERTAS: Alerta[] = [
    { id: '1', tipo: 'critico', titulo: 'Parada Não Autorizada', mensagem: 'Veículo parado há mais de 30 minutos em área não programada', veiculo: 'GOI-2B34', localizacao: 'BR-153, KM 245', timestamp: new Date(Date.now() - 5 * 60000) },
    { id: '2', tipo: 'alerta', titulo: 'Atraso na Entrega', mensagem: 'Previsão de atraso de 2 horas devido ao trânsito', veiculo: 'LOG-9E12', localizacao: 'São Paulo - Marginal Tietê', timestamp: new Date(Date.now() - 15 * 60000) },
    { id: '3', tipo: 'info', titulo: 'Documentação Pendente', mensagem: 'Aguardando aprovação de CNH renovada', veiculo: 'FRT-7F89', timestamp: new Date(Date.now() - 30 * 60000) },
    { id: '4', tipo: 'sucesso', titulo: 'Entrega Concluída', mensagem: 'Carga entregue com sucesso e documentos assinados', veiculo: 'CAR-3A56', localizacao: 'Brasília - DF', timestamp: new Date(Date.now() - 45 * 60000) },
    { id: '5', tipo: 'alerta', titulo: 'Manutenção Programada', mensagem: 'Veículo próximo da data de revisão obrigatória', veiculo: 'TRN-5F67', timestamp: new Date(Date.now() - 60 * 60000) },
    { id: '6', tipo: 'critico', titulo: 'Desvio de Rota', mensagem: 'Veículo saiu da rota programada', veiculo: 'BEN-8H90', localizacao: 'GO-060, KM 78', timestamp: new Date(Date.now() - 2 * 60000) },
];

function formatTimeAgo(date: Date): string {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h atrás`;
}

function AlertaCard({ alerta }: { alerta: Alerta }) {
    const config = {
        critico: {
            bg: 'bg-red-500/20',
            border: 'border-red-500/50',
            icon: XCircle,
            iconColor: 'text-red-400',
            animate: 'animate-pulse'
        },
        alerta: {
            bg: 'bg-amber-500/20',
            border: 'border-amber-500/30',
            icon: AlertTriangle,
            iconColor: 'text-amber-400',
            animate: ''
        },
        info: {
            bg: 'bg-blue-500/20',
            border: 'border-blue-500/30',
            icon: Info,
            iconColor: 'text-blue-400',
            animate: ''
        },
        sucesso: {
            bg: 'bg-emerald-500/20',
            border: 'border-emerald-500/30',
            icon: CheckCircle,
            iconColor: 'text-emerald-400',
            animate: ''
        },
    };

    const cfg = config[alerta.tipo];
    const Icon = cfg.icon;

    return (
        <div className={`${cfg.bg} backdrop-blur-xl rounded-xl p-4 border ${cfg.border} ${cfg.animate}`}>
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${cfg.bg} border ${cfg.border}`}>
                    <Icon className={`w-6 h-6 ${cfg.iconColor}`} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-white">{alerta.titulo}</h3>
                        <span className="text-xs text-slate-400">{formatTimeAgo(alerta.timestamp)}</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{alerta.mensagem}</p>
                    <div className="flex items-center gap-4 text-xs">
                        {alerta.veiculo && (
                            <div className="flex items-center gap-1 text-slate-400">
                                <Truck className="w-3 h-3" />
                                <span>{alerta.veiculo}</span>
                            </div>
                        )}
                        {alerta.localizacao && (
                            <div className="flex items-center gap-1 text-slate-400">
                                <MapPin className="w-3 h-3" />
                                <span>{alerta.localizacao}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TvAlertas() {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [alertas] = useState<Alerta[]>(MOCK_ALERTAS);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const criticos = alertas.filter(a => a.tipo === 'critico');
    const outros = alertas.filter(a => a.tipo !== 'critico');

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-white font-sans">
            <VideoBackground
                videoSrc="/bbt-background-optimized.webm"
                fallbackToAnimated={true}
            />

            <div className="relative z-10 min-h-screen p-6">
                <div className="space-y-4">
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
                                    <Bell className="w-6 h-6 text-red-400" />
                                    Central de Alertas
                                </h1>
                                <p className="text-red-400 text-sm font-semibold flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Monitoramento de Ocorrências
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Alert Counter */}
                            <div className="flex items-center gap-3">
                                <div className="bg-red-500/20 px-4 py-2 rounded-lg border border-red-500/30 animate-pulse">
                                    <span className="text-2xl font-black text-red-400">{criticos.length}</span>
                                    <span className="text-xs text-red-400/70 ml-1">críticos</span>
                                </div>
                                <div className="bg-amber-500/20 px-4 py-2 rounded-lg border border-amber-500/30">
                                    <span className="text-2xl font-black text-amber-400">{alertas.length}</span>
                                    <span className="text-xs text-amber-400/70 ml-1">total</span>
                                </div>
                            </div>

                            <div className="text-right bg-slate-900/50 backdrop-blur-xl rounded-lg px-4 py-2 border border-white/10">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-benfica-blue" />
                                    <span className="text-2xl font-mono font-bold text-white">
                                        {currentTime.toLocaleTimeString('pt-BR')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Críticos */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />
                                <h2 className="font-bold text-red-400">Alertas Críticos</h2>
                                <span className="ml-auto bg-red-500/30 px-2 py-0.5 rounded-full text-xs font-bold text-red-300">{criticos.length}</span>
                            </div>
                            <div className="space-y-3">
                                {criticos.map(alerta => (
                                    <AlertaCard key={alerta.id} alerta={alerta} />
                                ))}
                            </div>
                        </div>

                        {/* Outros */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-500/10 rounded-lg border border-slate-500/20">
                                <Bell className="w-5 h-5 text-slate-400" />
                                <h2 className="font-bold text-slate-300">Outras Notificações</h2>
                                <span className="ml-auto bg-slate-500/30 px-2 py-0.5 rounded-full text-xs font-bold text-slate-300">{outros.length}</span>
                            </div>
                            <div className="space-y-3">
                                {outros.map(alerta => (
                                    <AlertaCard key={alerta.id} alerta={alerta} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
