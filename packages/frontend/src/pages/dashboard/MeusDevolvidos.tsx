/**
 * Componente Minhas Viagens - Auditoria do Operador
 * O operador pode ver todos os cadastros enviados, status e historico
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
    RefreshCw,
    Truck,
    MapPin,
    Filter,
    Search,
    ChevronDown,
    ChevronUp,
    Package,
    ClipboardCheck,
    XCircle
} from 'lucide-react';
import { filaApi, type Submission } from '@/services/api';
import { useFilaSocket, type SubmissionUpdatedEvent, onSubmissionDevolvida, type SubmissionDevolvidaEvent } from '@/hooks/useSocket';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/useAuth';

interface ViagemItem {
    id: string;
    nomeMotorista: string;
    cpf: string;
    placa: string;
    origem: string;
    destino: string;
    status: string;
    dataEnvio: string;
    horaEnvio: string;
    motivoDevolucao?: string;
    categoria?: string;
    devolvidoPor?: string;
    devolvidoEm?: string;
    documentosCount: number;
    tipoMercadoria?: string;
    tipoCadastro?: string;
}

function mapApiToViagemItem(submission: Submission): ViagemItem {
    const data = new Date(submission.data_envio || submission.created_at);
    const devolvidoEm = (submission as any).devolvido_em
        ? new Date((submission as any).devolvido_em).toLocaleString('pt-BR')
        : undefined;

    return {
        id: submission.id,
        nomeMotorista: submission.nome_motorista || 'Nao informado',
        cpf: submission.cpf || '',
        placa: submission.placa || '',
        origem: (submission as any).origem || '',
        destino: (submission as any).destino || '',
        status: submission.status,
        dataEnvio: data.toLocaleDateString('pt-BR'),
        horaEnvio: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        motivoDevolucao: (submission as any).motivo_devolucao,
        categoria: formatCategoria((submission as any).categoria_devolucao),
        devolvidoPor: (submission as any).devolvido_por_nome,
        devolvidoEm,
        documentosCount: submission.documents?.length || 0,
        tipoMercadoria: (submission as any).tipo_mercadoria,
        tipoCadastro: (submission as any).tipo_cadastro || 'novo_cadastro',
    };
}

function formatCategoria(categoria: string | undefined): string {
    const categorias: Record<string, string> = {
        'documento_ilegivel': 'Documento Ilegivel',
        'documento_incompleto': 'Documento Incompleto',
        'dados_incorretos': 'Dados Incorretos',
        'falta_documento': 'Falta Documento',
    };
    return categorias[categoria || ''] || categoria || 'Nao categorizado';
}

function getStatusConfig(status: string) {
    const configs: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
        'pendente': { label: 'Pendente', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: Clock },
        'em_analise': { label: 'Em Analise', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: Eye },
        'aprovado': { label: 'Aprovado', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: CheckCircle },
        'rejeitado': { label: 'Rejeitado', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: XCircle },
        'devolvido': { label: 'Devolvido', color: 'text-orange-400', bgColor: 'bg-orange-500/20', icon: RotateCcw },
    };
    return configs[status] || { label: status, color: 'text-slate-400', bgColor: 'bg-slate-500/20', icon: FileText };
}

type FilterStatus = 'todos' | 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado' | 'devolvido';

export function MeusDevolvidos() {
    const { user } = useAuth();
    const [viagens, setViagens] = useState<ViagemItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isReenviando, setIsReenviando] = useState(false);
    const [reenviandoId, setReenviandoId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
    const [searchTerm, setSearchTerm] = useState('');

    // Conectar ao socket
    useSocket();

    const loadViagens = useCallback(async (showRefreshing = false) => {
        try {
            if (showRefreshing) setIsRefreshing(true);
            else setIsLoading(true);

            // Buscar todos os cadastros do operador
            const response = await filaApi.list({});

            if (response.success && response.data) {
                const items = response.data.map(mapApiToViagemItem);
                // Ordenar por data mais recente
                items.sort((a, b) => {
                    const dateA = new Date(`${a.dataEnvio} ${a.horaEnvio}`);
                    const dateB = new Date(`${b.dataEnvio} ${b.horaEnvio}`);
                    return dateB.getTime() - dateA.getTime();
                });
                setViagens(items);
                setError(null);
            } else {
                setError(response.error || 'Erro ao carregar viagens');
            }
        } catch (err) {
            setError('Erro de conexao com o servidor');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadViagens();
    }, [loadViagens]);

    // Listener para atualizacoes
    useEffect(() => {
        const unsub = onSubmissionDevolvida((event: SubmissionDevolvidaEvent) => {
            loadViagens();
        });
        return () => unsub();
    }, [loadViagens]);

    // WebSocket para atualizacoes em tempo real
    const handleUpdatedSubmission = useCallback((event: SubmissionUpdatedEvent) => {
        setViagens(prev => {
            const exists = prev.find(v => v.id === event.submission.id);
            if (exists) {
                return prev.map(v =>
                    v.id === event.submission.id
                        ? mapApiToViagemItem(event.submission)
                        : v
                );
            }
            return [mapApiToViagemItem(event.submission), ...prev];
        });
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
                loadViagens();
                alert('Cadastro reenviado com sucesso! Esta novamente na fila de analise.');
            } else {
                alert(response.error || 'Erro ao reenviar cadastro');
            }
        } catch (err) {
            alert('Erro de conexao');
        } finally {
            setIsReenviando(false);
            setReenviandoId(null);
        }
    };

    // Filtrar viagens
    const filteredViagens = viagens.filter(v => {
        const matchesStatus = filterStatus === 'todos' || v.status === filterStatus;
        const matchesSearch = searchTerm === '' ||
            v.nomeMotorista.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.cpf.includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    // Estatisticas
    const stats = {
        total: viagens.length,
        pendentes: viagens.filter(v => v.status === 'pendente').length,
        emAnalise: viagens.filter(v => v.status === 'em_analise').length,
        aprovados: viagens.filter(v => v.status === 'aprovado').length,
        devolvidos: viagens.filter(v => v.status === 'devolvido').length,
        rejeitados: viagens.filter(v => v.status === 'rejeitado').length,
    };

    if (isLoading) {
        return (
            <Container>
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-slate-400">Carregando suas viagens...</p>
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
                        onClick={() => loadViagens()}
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
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <Truck className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                Minhas Viagens
                            </h1>
                            <p className="text-slate-400 text-sm">
                                Acompanhe todos os seus cadastros enviados
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Indicador de conexao */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isConnected
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {isConnected ? 'Tempo Real' : 'Reconectando...'}
                        </div>

                        <button
                            onClick={() => loadViagens(true)}
                            disabled={isRefreshing}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Atualizar lista"
                        >
                            <RefreshCw className={`w-5 h-5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Cards de Estatisticas */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div
                        onClick={() => setFilterStatus('todos')}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                            filterStatus === 'todos'
                                ? 'bg-slate-600/30 border-2 border-slate-400'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                        <p className="text-xs text-slate-400">Total</p>
                    </div>
                    <div
                        onClick={() => setFilterStatus('pendente')}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                            filterStatus === 'pendente'
                                ? 'bg-yellow-500/30 border-2 border-yellow-400'
                                : 'bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20'
                        }`}
                    >
                        <p className="text-2xl font-bold text-yellow-400">{stats.pendentes}</p>
                        <p className="text-xs text-yellow-400/70">Pendentes</p>
                    </div>
                    <div
                        onClick={() => setFilterStatus('em_analise')}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                            filterStatus === 'em_analise'
                                ? 'bg-blue-500/30 border-2 border-blue-400'
                                : 'bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20'
                        }`}
                    >
                        <p className="text-2xl font-bold text-blue-400">{stats.emAnalise}</p>
                        <p className="text-xs text-blue-400/70">Em Analise</p>
                    </div>
                    <div
                        onClick={() => setFilterStatus('aprovado')}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                            filterStatus === 'aprovado'
                                ? 'bg-emerald-500/30 border-2 border-emerald-400'
                                : 'bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                    >
                        <p className="text-2xl font-bold text-emerald-400">{stats.aprovados}</p>
                        <p className="text-xs text-emerald-400/70">Aprovados</p>
                    </div>
                    <div
                        onClick={() => setFilterStatus('devolvido')}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                            filterStatus === 'devolvido'
                                ? 'bg-orange-500/30 border-2 border-orange-400'
                                : 'bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20'
                        }`}
                    >
                        <p className="text-2xl font-bold text-orange-400">{stats.devolvidos}</p>
                        <p className="text-xs text-orange-400/70">Devolvidos</p>
                    </div>
                    <div
                        onClick={() => setFilterStatus('rejeitado')}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                            filterStatus === 'rejeitado'
                                ? 'bg-red-500/30 border-2 border-red-400'
                                : 'bg-red-500/10 border border-red-500/20 hover:bg-red-500/20'
                        }`}
                    >
                        <p className="text-2xl font-bold text-red-400">{stats.rejeitados}</p>
                        <p className="text-xs text-red-400/70">Rejeitados</p>
                    </div>
                </div>

                {/* Barra de Pesquisa */}
                <div className="flex items-center gap-3 bg-white/5 rounded-xl p-2 border border-white/10">
                    <Search className="w-5 h-5 text-slate-400 ml-2" />
                    <input
                        type="text"
                        placeholder="Buscar por motorista, placa ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none py-2"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="p-1 hover:bg-white/10 rounded"
                        >
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    )}
                </div>

                {/* Lista vazia */}
                {filteredViagens.length === 0 && (
                    <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
                        <Package className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">
                            {filterStatus === 'todos' && searchTerm === ''
                                ? 'Nenhuma viagem encontrada'
                                : 'Nenhum resultado para o filtro'}
                        </h2>
                        <p className="text-slate-400">
                            {filterStatus === 'todos' && searchTerm === ''
                                ? 'Voce ainda nao enviou nenhum cadastro.'
                                : 'Tente ajustar os filtros de busca.'}
                        </p>
                    </div>
                )}

                {/* Lista de viagens */}
                <div className="space-y-3">
                    {filteredViagens.map((item) => {
                        const statusConfig = getStatusConfig(item.status);
                        const StatusIcon = statusConfig.icon;
                        const isExpanded = expandedId === item.id;

                        return (
                            <div
                                key={item.id}
                                className={`bg-white/5 rounded-xl border transition-all ${
                                    item.status === 'devolvido'
                                        ? 'border-orange-500/30'
                                        : 'border-white/10 hover:border-white/20'
                                }`}
                            >
                                {/* Header do Card */}
                                <div
                                    className="p-4 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
                                                <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-bold text-white truncate">
                                                        {item.nomeMotorista || 'Motorista'}
                                                    </p>
                                                    {item.placa && (
                                                        <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded font-mono">
                                                            {item.placa}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400">
                                                    {item.dataEnvio} as {item.horaEnvio}
                                                    {item.origem && item.destino && (
                                                        <span className="ml-2">
                                                            <MapPin className="w-3 h-3 inline" /> {item.origem} → {item.destino}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bgColor} ${statusConfig.color}`}>
                                                {statusConfig.label}
                                            </span>
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Detalhes expandidos */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-3">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <p className="text-slate-500 text-xs">CPF</p>
                                                <p className="text-white font-mono">{item.cpf || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-xs">Placa</p>
                                                <p className="text-white font-mono">{item.placa || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-xs">Documentos</p>
                                                <p className="text-white">{item.documentosCount} anexos</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-xs">Tipo</p>
                                                <p className="text-white capitalize">{item.tipoCadastro?.replace('_', ' ') || 'Novo Cadastro'}</p>
                                            </div>
                                        </div>

                                        {/* Informacoes de devolucao */}
                                        {item.status === 'devolvido' && item.motivoDevolucao && (
                                            <div className="bg-orange-500/10 border-l-4 border-orange-500 p-3 rounded-r-lg">
                                                <p className="text-xs text-orange-400 font-bold mb-1">Motivo da Devolucao:</p>
                                                <p className="text-sm text-white">{item.motivoDevolucao}</p>
                                                <p className="text-xs text-slate-400 mt-2">
                                                    Devolvido por {item.devolvidoPor || 'Analista'} • {item.devolvidoEm}
                                                </p>
                                            </div>
                                        )}

                                        {/* Acoes */}
                                        {item.status === 'devolvido' && (
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleReenviar(item.id);
                                                    }}
                                                    disabled={isReenviando && reenviandoId === item.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                                >
                                                    {isReenviando && reenviandoId === item.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Send className="w-4 h-4" />
                                                    )}
                                                    Reenviar para Analise
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legenda */}
                {filteredViagens.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-xs text-slate-400 mb-2 font-bold">Legenda de Status:</p>
                        <div className="flex flex-wrap gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <span className="text-slate-400">Pendente - Aguardando analise</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-slate-400">Em Analise - Sendo avaliado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-slate-400">Aprovado - Cadastro aceito</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                <span className="text-slate-400">Devolvido - Precisa correcao</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-slate-400">Rejeitado - Nao aprovado</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Container>
    );
}
