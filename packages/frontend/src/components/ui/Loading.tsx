import { Loader2 } from 'lucide-react';

export function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-midnight font-sans">
            <div className="relative">
                <div className="absolute -inset-4 bg-benfica-blue/30 rounded-full blur-xl animate-pulse" />
                <Loader2 className="w-12 h-12 text-benfica-blue animate-spin relative z-10" />
            </div>
            <p className="mt-4 text-slate-400 font-medium animate-pulse">Carregando...</p>
        </div>
    );
}

export function LoadingSmall() {
    return (
        <div className="flex items-center justify-center p-4">
            <Loader2 className="w-6 h-6 text-benfica-blue animate-spin" />
        </div>
    );
}
