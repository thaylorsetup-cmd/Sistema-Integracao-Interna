import { useNavigate } from 'react-router-dom';
import {
    Bell,
    ArrowLeft,
} from 'lucide-react';

export function Notificacoes() {
    const navigate = useNavigate();

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-4 lg:p-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-cyan-500/10" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-slate-800/50 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <Bell className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-white">
                            Notificações
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Central de notificações do sistema
                        </p>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-16 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                        <Bell className="w-10 h-10 text-slate-500" />
                    </div>
                    <p className="text-lg text-slate-300 font-semibold">Nenhuma notificação</p>
                    <p className="text-sm text-slate-500 mt-2">
                        Quando houver notificações, elas aparecerão aqui.
                    </p>
                </div>
            </div>
        </div>
    );
}
