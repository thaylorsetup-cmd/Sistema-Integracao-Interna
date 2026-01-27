import { useState, useEffect, useCallback } from 'react';
import {
    Ticket as TicketIcon,
    Search,
    Filter,
    MessageCircle,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    Send,
    Trash2,
    ChevronDown,
    ChevronUp,
    Bug,
    HelpCircle,
    Lightbulb,
    FileText,
    RefreshCw,
} from 'lucide-react';
import { ticketApi } from '@/services/api';
import type { Ticket, TicketStatus } from '@/services/api';

const statusConfig: Record<TicketStatus, { label: string; color: string; icon: React.ElementType }> = {
    aberto: { label: 'Aberto', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: AlertCircle },
    em_andamento: { label: 'Em Andamento', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
    resolvido: { label: 'Resolvido', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
    fechado: { label: 'Fechado', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: XCircle },
};

const categoriaConfig: Record<string, { label: string; icon: React.ElementType }> = {
    bug: { label: 'Bug / Erro', icon: Bug },
    duvida: { label: 'Dúvida', icon: HelpCircle },
    sugestao: { label: 'Sugestão', icon: Lightbulb },
    outro: { label: 'Outro', icon: FileText },
};

export function Tickets() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
    const [respondingTo, setRespondingTo] = useState<string | null>(null);
    const [resposta, setResposta] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [stats, setStats] = useState<{ total: number; byStatus: Record<string, number> } | null>(null);

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = { page, limit: 15 };
            if (statusFilter) params.status = statusFilter;

            const response = await ticketApi.list(params);
            if (response.success && response.data) {
                setTickets(response.data as unknown as Ticket[]);
                if ((response as any).pagination) {
                    setTotalPages((response as any).pagination.totalPages);
                    setTotal((response as any).pagination.total);
                }
            }
        } catch (err) {
            console.error('Erro ao buscar tickets:', err);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await ticketApi.stats();
            if (response.success && response.data) {
                setStats(response.data as any);
            }
        } catch {
            // silently fail
        }
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleUpdateStatus = async (id: string, status: TicketStatus) => {
        setActionLoading(true);
        try {
            await ticketApi.updateStatus(id, status);
            fetchTickets();
            fetchStats();
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleResponder = async (id: string) => {
        if (!resposta.trim()) return;
        setActionLoading(true);
        try {
            await ticketApi.responder(id, resposta);
            setResposta('');
            setRespondingTo(null);
            fetchTickets();
            fetchStats();
        } catch (err) {
            console.error('Erro ao responder:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja deletar este ticket?')) return;
        setActionLoading(true);
        try {
            await ticketApi.delete(id);
            fetchTickets();
            fetchStats();
        } catch (err) {
            console.error('Erro ao deletar:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <div className="p-3 bg-cyan-500/20 rounded-xl">
                            <TicketIcon className="w-8 h-8 text-cyan-400" />
                        </div>
                        Gestão de Tickets
                    </h1>
                    <p className="mt-2 text-slate-400">
                        Gerencie os tickets de suporte enviados pelos usuários
                    </p>
                </div>
                <button
                    onClick={() => { fetchTickets(); fetchStats(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4 text-center">
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                        <p className="text-xs text-slate-400 mt-1">Total</p>
                    </div>
                    <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-4 text-center">
                        <p className="text-2xl font-bold text-blue-400">{stats.byStatus?.aberto || 0}</p>
                        <p className="text-xs text-slate-400 mt-1">Abertos</p>
                    </div>
                    <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-amber-500/20 p-4 text-center">
                        <p className="text-2xl font-bold text-amber-400">{stats.byStatus?.em_andamento || 0}</p>
                        <p className="text-xs text-slate-400 mt-1">Em Andamento</p>
                    </div>
                    <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-400">{stats.byStatus?.resolvido || 0}</p>
                        <p className="text-xs text-slate-400 mt-1">Resolvidos</p>
                    </div>
                    <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-slate-500/20 p-4 text-center">
                        <p className="text-2xl font-bold text-slate-400">{stats.byStatus?.fechado || 0}</p>
                        <p className="text-xs text-slate-400 mt-1">Fechados</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => { setStatusFilter(''); setPage(1); }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        !statusFilter
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                    Todos
                </button>
                {(Object.entries(statusConfig) as [TicketStatus, typeof statusConfig[TicketStatus]][]).map(([key, config]) => (
                    <button
                        key={key}
                        onClick={() => { setStatusFilter(key); setPage(1); }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                            statusFilter === key
                                ? config.color + ' border'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                        <config.icon className="w-3.5 h-3.5" />
                        {config.label}
                    </button>
                ))}
            </div>

            {/* Tickets List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
            ) : tickets.length === 0 ? (
                <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
                    <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-lg text-slate-400">Nenhum ticket encontrado</p>
                    <p className="text-sm text-slate-500 mt-1">
                        {statusFilter ? 'Tente mudar o filtro de status' : 'Os tickets enviados pelos usuários aparecerão aqui'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tickets.map((ticket) => {
                        const isExpanded = expandedTicket === ticket.id;
                        const isResponding = respondingTo === ticket.id;
                        const statusInfo = statusConfig[ticket.status] || statusConfig.aberto;
                        const catInfo = categoriaConfig[ticket.categoria] || categoriaConfig.outro;
                        const StatusIcon = statusInfo.icon;
                        const CatIcon = catInfo.icon;

                        return (
                            <div
                                key={ticket.id}
                                className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden transition-all duration-200"
                            >
                                {/* Ticket Header */}
                                <button
                                    onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
                                >
                                    <div className={`p-2 rounded-xl ${statusInfo.color}`}>
                                        <StatusIcon className="w-4 h-4" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-white font-semibold truncate">{ticket.titulo}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <CatIcon className="w-3.5 h-3.5" />
                                                {catInfo.label}
                                            </span>
                                            <span>|</span>
                                            <span>{ticket.usuario_nome || 'Anônimo'}</span>
                                            <span>|</span>
                                            <span>{formatDate(ticket.created_at)}</span>
                                        </div>
                                    </div>

                                    {ticket.resposta && (
                                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg font-medium">
                                            Respondido
                                        </span>
                                    )}

                                    {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                                    )}
                                </button>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t border-white/5 p-4 space-y-4">
                                        {/* Descrição */}
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Descrição</p>
                                            <p className="text-slate-300 whitespace-pre-wrap text-sm bg-slate-900/50 rounded-xl p-4">
                                                {ticket.descricao}
                                            </p>
                                        </div>

                                        {/* Info do Usuário */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="bg-slate-900/30 rounded-xl p-3">
                                                <p className="text-xs text-slate-500">Usuário</p>
                                                <p className="text-sm text-white font-medium">{ticket.usuario_nome || 'N/A'}</p>
                                            </div>
                                            <div className="bg-slate-900/30 rounded-xl p-3">
                                                <p className="text-xs text-slate-500">Email</p>
                                                <p className="text-sm text-white font-medium">{ticket.usuario_email || 'N/A'}</p>
                                            </div>
                                            <div className="bg-slate-900/30 rounded-xl p-3">
                                                <p className="text-xs text-slate-500">Criado em</p>
                                                <p className="text-sm text-white font-medium">{formatDate(ticket.created_at)}</p>
                                            </div>
                                        </div>

                                        {/* Resposta existente */}
                                        {ticket.resposta && (
                                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                                                <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-2">Resposta</p>
                                                <p className="text-slate-300 whitespace-pre-wrap text-sm">{ticket.resposta}</p>
                                                {ticket.respondido_em && (
                                                    <p className="text-xs text-slate-500 mt-2">
                                                        Respondido em {formatDate(ticket.respondido_em)}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Formulário de Resposta */}
                                        {isResponding && (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={resposta}
                                                    onChange={(e) => setResposta(e.target.value)}
                                                    placeholder="Digite sua resposta ao ticket..."
                                                    rows={4}
                                                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 resize-none focus:outline-none focus:border-cyan-500/50"
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => { setRespondingTo(null); setResposta(''); }}
                                                        className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 text-sm"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={() => handleResponder(ticket.id)}
                                                        disabled={actionLoading || !resposta.trim()}
                                                        className="px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                                        <Send className="w-4 h-4" />
                                                        Enviar Resposta
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                                            {/* Responder */}
                                            {!isResponding && (
                                                <button
                                                    onClick={() => { setRespondingTo(ticket.id); setResposta(ticket.resposta || ''); }}
                                                    className="flex items-center gap-2 px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl text-sm font-medium hover:bg-cyan-500/30 transition-colors"
                                                >
                                                    <Send className="w-3.5 h-3.5" />
                                                    {ticket.resposta ? 'Editar Resposta' : 'Responder'}
                                                </button>
                                            )}

                                            {/* Status Changes */}
                                            {ticket.status === 'aberto' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(ticket.id, 'em_andamento')}
                                                    disabled={actionLoading}
                                                    className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-500/30 transition-colors"
                                                >
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Em Andamento
                                                </button>
                                            )}

                                            {(ticket.status === 'aberto' || ticket.status === 'em_andamento') && (
                                                <button
                                                    onClick={() => handleUpdateStatus(ticket.id, 'resolvido')}
                                                    disabled={actionLoading}
                                                    className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Resolver
                                                </button>
                                            )}

                                            {ticket.status !== 'fechado' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(ticket.id, 'fechado')}
                                                    disabled={actionLoading}
                                                    className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-600 transition-colors"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Fechar
                                                </button>
                                            )}

                                            {ticket.status === 'fechado' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(ticket.id, 'aberto')}
                                                    disabled={actionLoading}
                                                    className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-500/30 transition-colors"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                    Reabrir
                                                </button>
                                            )}

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(ticket.id)}
                                                disabled={actionLoading}
                                                className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors ml-auto"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Deletar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                        Página {page} de {totalPages} ({total} tickets)
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-700 transition-colors"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-700 transition-colors"
                        >
                            Próximo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
