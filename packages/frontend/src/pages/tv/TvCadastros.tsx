import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoBackground } from '@/components/ui';
import {
    Clock,
    FileText,
    User,
    Truck as TruckIcon,
    MapPin,
    CheckCircle,
    Clock as ClockIcon,
    AlertCircle,
    Sparkles,
    ArrowLeft
} from 'lucide-react';

interface CadastroItem {
    id: string;
    motorista: string;
    placaCavalo: string;
    placaCarreta: string;
    origem: string;
    destino: string;
    documentos: number;
    status: 'pendente' | 'em_analise' | 'aprovado';
    tempoEspera: string;
    prioridade: 'normal' | 'urgente';
    delaysCount?: number;
}

const MOCK_CADASTROS: CadastroItem[] = [
    { id: '1', motorista: 'João Silva', placaCavalo: 'GOI-2B34', placaCarreta: 'ABC-1234', origem: 'Goiânia', destino: 'São Paulo', documentos: 5, status: 'pendente', tempoEspera: '15min', prioridade: 'urgente', delaysCount: 2 },
    { id: '2', motorista: 'Carlos Oliveira', placaCavalo: 'LOG-9E12', placaCarreta: 'DEF-5678', origem: 'Goiânia', destino: 'Brasília', documentos: 4, status: 'pendente', tempoEspera: '32min', prioridade: 'normal' },
    { id: '3', motorista: 'Pedro Santos', placaCavalo: 'FRT-7F89', placaCarreta: 'GHI-9012', origem: 'Goiânia', destino: 'Cuiabá', documentos: 6, status: 'em_analise', tempoEspera: '45min', prioridade: 'normal', delaysCount: 1 },
    { id: '4', motorista: 'André Costa', placaCavalo: 'CAR-3A56', placaCarreta: 'JKL-3456', origem: 'Goiânia', destino: 'Belo Horizonte', documentos: 5, status: 'pendente', tempoEspera: '8min', prioridade: 'urgente' },
    { id: '5', motorista: 'Lucas Ferreira', placaCavalo: 'TRN-5F67', placaCarreta: 'MNO-7890', origem: 'Goiânia', destino: 'Uberlândia', documentos: 4, status: 'em_analise', tempoEspera: '1h 15min', prioridade: 'normal' },
    { id: '6', motorista: 'Marcos Souza', placaCavalo: 'BEN-8H90', placaCarreta: 'PQR-1234', origem: 'Goiânia', destino: 'Campo Grande', documentos: 5, status: 'aprovado', tempoEspera: '—', prioridade: 'normal' },
];

function CadastroCard({ cadastro }: { cadastro: CadastroItem }) {
    const statusConfig = {
        pendente: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Pendente' },
        em_analise: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Em Análise' },
        aprovado: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Aprovado' },
    };
    const status = statusConfig[cadastro.status];

    return (
        <div className={`relative bg-slate-950/60 backdrop-blur-xl rounded-xl p-4 border ${cadastro.prioridade === 'urgente' ? 'border-red-500/50 animate-pulse' : 'border-white/10'}`}>
            {/* Delay Badge - Positioned absolutely in top-right corner */}
            {cadastro.delaysCount && cadastro.delaysCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse shadow-lg border-2 border-slate-950 z-10">
                    <ClockIcon className="w-3 h-3" />
                    {cadastro.delaysCount} ATRASO{cadastro.delaysCount > 1 ? 'S' : ''}
                </div>
            )}

            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-benfica-blue/20 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-benfica-blue" />
                    </div>
                    <div>
                        <p className="font-bold text-white">{cadastro.motorista}</p>
                        <p className="text-xs text-slate-400">{cadastro.placaCavalo} / {cadastro.placaCarreta}</p>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full ${status.bg} ${status.border} border`}>
                    <span className={`text-xs font-bold ${status.text}`}>{status.label}</span>
                </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3 h-3" />
                    <span>{cadastro.origem} → {cadastro.destino}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                    <FileText className="w-3 h-3" />
                    <span>{cadastro.documentos} docs</span>
                </div>
                {cadastro.status !== 'aprovado' && (
                    <div className="flex items-center gap-1 text-amber-400">
                        <ClockIcon className="w-3 h-3" />
                        <span>{cadastro.tempoEspera}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export function TvCadastros() {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [cadastros] = useState<CadastroItem[]>(MOCK_CADASTROS);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const pendentes = cadastros.filter(c => c.status === 'pendente');
    const emAnalise = cadastros.filter(c => c.status === 'em_analise');
    const aprovados = cadastros.filter(c => c.status === 'aprovado');
    const comAtrasos = cadastros.filter(c => c.delaysCount && c.delaysCount > 0).length;
    const totalAtrasos = cadastros.reduce((sum, c) => sum + (c.delaysCount || 0), 0);

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
                                    <FileText className="w-6 h-6 text-amber-400" />
                                    Fila de Cadastros
                                </h1>
                                <p className="text-amber-400 text-sm font-semibold flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Aprovação de Documentos
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Counters */}
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-500/20 px-4 py-2 rounded-lg border border-amber-500/30">
                                    <span className="text-2xl font-black text-amber-400">{pendentes.length}</span>
                                    <span className="text-xs text-amber-400/70 ml-1">pendentes</span>
                                </div>
                                <div className="bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-500/30">
                                    <span className="text-2xl font-black text-blue-400">{emAnalise.length}</span>
                                    <span className="text-xs text-blue-400/70 ml-1">em análise</span>
                                </div>
                                <div className="bg-emerald-500/20 px-4 py-2 rounded-lg border border-emerald-500/30">
                                    <span className="text-2xl font-black text-emerald-400">{aprovados.length}</span>
                                    <span className="text-xs text-emerald-400/70 ml-1">aprovados</span>
                                </div>
                                {/* Delay Counter - New */}
                                {comAtrasos > 0 && (
                                    <div className="bg-amber-500/30 px-4 py-2 rounded-lg border border-amber-500/50 animate-pulse">
                                        <div className="flex items-center gap-1">
                                            <ClockIcon className="w-4 h-4 text-amber-300" />
                                            <span className="text-2xl font-black text-amber-300">{totalAtrasos}</span>
                                        </div>
                                        <span className="text-xs text-amber-300/70">atraso{totalAtrasos > 1 ? 's' : ''}</span>
                                    </div>
                                )}
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

                    {/* Kanban Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Pendentes */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <AlertCircle className="w-5 h-5 text-amber-400" />
                                <h2 className="font-bold text-amber-400">Pendentes</h2>
                                <span className="ml-auto bg-amber-500/30 px-2 py-0.5 rounded-full text-xs font-bold text-amber-300">{pendentes.length}</span>
                            </div>
                            <div className="space-y-2">
                                {pendentes.map(cadastro => (
                                    <CadastroCard key={cadastro.id} cadastro={cadastro} />
                                ))}
                            </div>
                        </div>

                        {/* Em Análise */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <ClockIcon className="w-5 h-5 text-blue-400" />
                                <h2 className="font-bold text-blue-400">Em Análise</h2>
                                <span className="ml-auto bg-blue-500/30 px-2 py-0.5 rounded-full text-xs font-bold text-blue-300">{emAnalise.length}</span>
                            </div>
                            <div className="space-y-2">
                                {emAnalise.map(cadastro => (
                                    <CadastroCard key={cadastro.id} cadastro={cadastro} />
                                ))}
                            </div>
                        </div>

                        {/* Aprovados */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                <h2 className="font-bold text-emerald-400">Aprovados Hoje</h2>
                                <span className="ml-auto bg-emerald-500/30 px-2 py-0.5 rounded-full text-xs font-bold text-emerald-300">{aprovados.length}</span>
                            </div>
                            <div className="space-y-2">
                                {aprovados.map(cadastro => (
                                    <CadastroCard key={cadastro.id} cadastro={cadastro} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
