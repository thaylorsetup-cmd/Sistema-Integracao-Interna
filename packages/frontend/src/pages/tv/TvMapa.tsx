import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BBTMatrixMap } from '@/components/dashboard';
import { VideoBackground } from '@/components/ui';
import { Truck, Clock, Sparkles, ArrowLeft } from 'lucide-react';

export function TvMapa() {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-white font-sans">
            {/* Video Background */}
            <VideoBackground
                videoSrc="/bbt-background-optimized.webm"
                fallbackToAnimated={true}
            />

            {/* Content Layer */}
            <div className="relative z-10 min-h-screen flex flex-col p-4">
                {/* Compact Header */}
                <div className="flex items-center justify-between bg-slate-950/70 backdrop-blur-xl rounded-xl p-4 border border-white/10 mb-4">
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
                                <Truck className="w-6 h-6 text-benfica-blue" />
                                BBT Connect
                            </h1>
                            <p className="text-benfica-blue text-sm font-semibold flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Rastreamento em Tempo Real
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/30">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-emerald-400 text-sm font-bold">LIVE</span>
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

                {/* Full Map */}
                <div className="flex-1 bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                    <BBTMatrixMap className="h-full min-h-[calc(100vh-140px)]" />
                </div>
            </div>
        </div>
    );
}
