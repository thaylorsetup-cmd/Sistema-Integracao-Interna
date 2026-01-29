/**
 * Componente para mostrar cadastros devolvidos ao operador
 * O operador pode ver o motivo da devolução e reenviar o cadastro
 */
import { useState, useEffect, useCallback } from 'react';
import { Container } from '@/components/layout';
import {
    RotateCcw,
    AlertTriangle,
    FileText,
    Send,
    Clock,
    User,
    Calendar,
    Eye,
    X,
    Loader2,
    CheckCircle,
    RefreshCw
} from 'lucide-react';
import { filaApi, type Submission } from '@/services/api';
import { useFilaSocket, type SubmissionUpdatedEvent, onSubmissionDevolvida, type SubmissionDevolvidaEvent } from '@/hooks/useSocket';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/useAuth';

interface DevolvidoItem {
    id: string;
    operador: string;
    dataEnvio: string;
    horaEnvio: string;
    motivoDevolucao: string;
    categoria: string;
    devolvidoPor: string;
    devolvidoEm: string;
    documentosCount: number;
}

function mapApiToDevolvidoItem(submission: Submission): DevolvidoItem {
    const data = new Date(submission.data_envio || submission.created_at);
    const devolvidoEm = (submission as any).devolvido_em
        ? new Date((submission as any).devolvido_em).toLocaleString('pt-BR')
        : '—';

    return {
        id: submission.id,
        operador: (submission as any).operador_nome || submission.nome_motorista || 'Operador',
        dataEnvio: data.toLocaleDateString('pt-BR'),
        horaEnvio: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        motivoDevolucao: (submission as any).motivo_devolucao || 'Sem motivo informado',
        categoria: formatCategoria((submission as any).categoria_devolucao),
        devolvidoPor: (submission as any).devolvido_por_nome || 'Analista',
        devolvidoEm,
        documentosCount: submission.documents?.length || 0,
    };
}

function formatCategoria(categoria: string | undefined): string {
    const categorias: Record<string, string> = {
        'documento_ilegivel': 'Documento Ilegível',
        'documento_incompleto': 'Documento Incompleto',
        'dados_incorretos': 'Dados Incorretos',
        'falta_documento': 'Falta Documento',
    };
    return categorias[categoria || ''] || categoria || 'Não categorizado';
}

export function MeusDevolvidos() {
    const { user } = useAuth();
    const [devolvidos, setDevolvidos] = useState<DevolvidoItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<DevolvidoItem | null>(null);
    const [isReenviando, setIsReenviando] = useState(false);
    const [reenviandoId, setReenviandoId] = useState<string | null>(null);
    const [newDevolvido, setNewDevolvido] = useState(false);

    // Conectar ao socket e entrar na sala do usuario
    useSocket();

    const loadDevolvidos = useCallback(async (showRefreshing = false) => {
        try {
            if (showRefreshing) setIsRefreshing(true);
            else setIsLoading(true);

            const response = await filaApi.list({ status: 'devolvido' });

            if (response.success && response.data) {
                const items = response.data.map(mapApiToDevolvidoItem);
                setDevolvidos(items);
                setError(null);
            } else {
                setError(response.error || 'Erro ao carregar devolvidos');
            }
        } catch (err) {
            setError('Erro de conexão com o servidor');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDevolvidos();
    }, [loadDevolvidos]);

    // Listener especifico para novas devolucoes
    useEffect(() => {
        const unsub = onSubmissionDevolvida((event: SubmissionDevolvidaEvent) => {
            console.log('[MeusDevolvidos] Nova devolucao recebida:', event);
            // Recarregar lista quando receber devolucao
            loadDevolvidos();
            setNewDevolvido(true);
            // Limpar indicador apos 3 segundos
            setTimeout(() => setNewDevolvido(false), 3000);
        });

        return () => unsub();
    }, [loadDevolvidos]);

    // WebSocket para atualizações
    const handleUpdatedSubmission = useCallback((event: SubmissionUpdatedEvent) => {
        if (event.submission.status === 'devolvido') {
            // Adicionar ou atualizar item devolvido
            setDevolvidos(prev => {
                const exists = prev.find(d => d.id === event.submission.id);
                if (exists) {
                    return prev.map(d =>
                        d.id === event.submission.id
                            ? mapApiToDevolvidoItem(event.submission)
                            : d
                    );
                }
                return [mapApiToDevolvidoItem(event.submission), ...prev];
            });
        } else {
            // Se mudou de status, remover da lista
            setDevolvidos(prev => prev.filter(d => d.id !== event.submission.id));
        }
    }, []);

    const { isConnected } = useFilaSocket({
        onUpdated: handleUpdatedSubmission,
    });

    const handleReenviar = async (id: string) => {
        setIsReenviando(true);
        setReenviandoId(id);

        try {
            const response = await filaApi.reenviar(id);

            if (response.success) {
                // Remover da lista de devolvidos
                setDevolvidos(prev => prev.filter(d => d.id !== id));
                setSelectedItem(null);
                alert('Cadastro reenviado com sucesso! Está novamente na fila de análise.');
            } else {
                alert(response.error || 'Erro ao reenviar cadastro');
            }
        } catch (err) {
            alert('Erro de conexão');
        } finally {
            setIsReenviando(false);
            setReenviandoId(null);
        }
    };

    if (isLoading) {
        return (
            <Container>
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                    <p className="text-slate-400">Carregando cadastros devolvidos...</p>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                    <AlertTriangle className="w-12 h-12 text-red-400" />
                    <p className="text-red-400">{error}</p>
                    <button
                        onClick={() => loadDevolvidos()}
                        className="px-4 py-2 bg-benfica-blue text-white rounded-lg hover:bg-benfica-blue/80"
                    >
                        Tentar novamente
                    </button>
                </div>
            </Container>
        );
    }

    return (
        <Container>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500/20 rounded-xl">
                            <RotateCcw className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                Cadastros Devolvidos
                                {newDevolvido && (
                                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                        NOVO
                                    </span>
                                )}
                            </h1>
                            <p className="text-slate-400 text-sm">
                                Cadastros que precisam de correção
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Indicador de conexão */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isConnected
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {isConnected ? 'Online' : 'Offline'}
                        </div>

                        <button
                            onClick={() => loadDevolvidos(true)}
                            disabled={isRefreshing}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <RefreshCw className={`w-5 h-5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Lista vazia */}
                {devolvidos.length === 0 && (
                    <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
                        <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Tudo em ordem!</h2>
                        <p className="text-slate-400">
                            Você não tem cadastros pendentes de correção.
                        </p>
                    </div>
                )}

                {/* Lista de devolvidos */}
                <div className="space-y-4">
                    {devolvidos.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white/5 rounded-xl p-5 border border-orange-500/30 hover:border-orange-500/50 transition-all"
                        >
                            <div className="flex items-start justify-between gap-4">
                                {/* Info principal */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-orange-500/20 rounded-lg">
                                            <AlertTriangle className="w-4 h-4 text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">Cadastro #{item.id.substring(0, 8)}</p>
                                            <p className="text-xs text-slate-400">
                                                Enviado em {item.dataEnvio} às {item.horaEnvio}
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full">
                                            {item.categoria}
                                        </span>
                                    </div>

                                    {/* Motivo da devolução */}
                                    <div className="bg-orange-500/10 border-l-4 border-orange-500 p-3 rounded-r-lg mb-3">
                                        <p className="text-sm text-white">{item.motivoDevolucao}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Devolvido por {item.devolvidoPor} • {item.devolvidoEm}
                                        </p>
                                    </div>

                                    {/* Info extra */}
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            {item.documentosCount} documento{item.documentosCount !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>

                                {/* Ações */}
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handleReenviar(item.id)}
                                        disabled={isReenviando && reenviandoId === item.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                    >
                                        {isReenviando && reenviandoId === item.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                        Reenviar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dica */}
                {devolvidos.length > 0 && (
                    <div className="bg-benfica-blue/10 border border-benfica-blue/30 rounded-xl p-4 flex items-start gap-3">
                        <div className="p-2 bg-benfica-blue/20 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-benfica-blue" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white mb-1">Como corrigir?</p>
                            <p className="text-xs text-slate-400">
                                Verifique o motivo da devolução, faça as correções necessárias nos documentos
                                e clique em "Reenviar" para enviar novamente para análise.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Container>
    );
}
