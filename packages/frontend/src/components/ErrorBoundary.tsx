import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-slate-900 border border-red-500/20 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4 text-red-400">
                            <AlertCircle className="w-8 h-8" />
                            <h1 className="text-xl font-bold">Ops! Algo deu errado.</h1>
                        </div>

                        <p className="text-slate-400 mb-4">
                            Ocorreu um erro inesperado na aplicação.
                        </p>

                        <div className="bg-black/50 rounded-lg p-4 mb-6 overflow-auto max-h-48 border border-white/5">
                            <p className="text-red-300 font-mono text-xs break-all">
                                {this.state.error?.toString()}
                            </p>
                            {this.state.errorInfo && (
                                <pre className="text-slate-500 font-mono text-[10px] mt-2 whitespace-pre-wrap">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            )}
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
