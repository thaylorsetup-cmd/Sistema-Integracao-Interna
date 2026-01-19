import { useState, useMemo, useEffect } from 'react';
import { useAuth, useIsAdmin } from '@/contexts';
import {
    FileText,
    Search,
    Filter,
    Download,
    Calendar,
    User,
    Clock,
    Activity,
    LogIn,
    LogOut,
    Edit,
    Trash2,
    Check,
    X,
    Eye,
    Settings,
    ChevronDown,
    RefreshCw,
    Users,
    TrendingUp,
    Shield,
    Database,
    Wifi,
    WifiOff,
    Server,
    Zap,
    Award,
    ChevronRight,
    BarChart3,
    AlertCircle,
    XCircle,
    TrendingDown,
} from 'lucide-react';
import { getLogs, getUsuarios } from '@/services/mockDatabase';
import { dashboardApi } from '@/services/api';
import type { LogAuditoria, LogTipo, User as UserType } from '@/types';

const tipoIcons: Record<LogTipo, React.ElementType> = {
    LOGIN: LogIn,
    LOGOUT: LogOut,
    CRIAR: Edit,
    EDITAR: Edit,
    DELETAR: Trash2,
    APROVAR: Check,
    REJEITAR: X,
    VISUALIZAR: Eye,
    EXPORTAR: Download,
    CONFIG: Settings,
};

const tipoColors: Record<LogTipo, string> = {
    LOGIN: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    LOGOUT: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    CRIAR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    EDITAR: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    DELETAR: 'bg-red-500/20 text-red-400 border-red-500/30',
    APROVAR: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    REJEITAR: 'bg-red-500/20 text-red-400 border-red-500/30',
    VISUALIZAR: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    EXPORTAR: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    CONFIG: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const tiposDisponiveis: LogTipo[] = ['LOGIN', 'LOGOUT', 'CRIAR', 'EDITAR', 'DELETAR', 'APROVAR', 'REJEITAR', 'VISUALIZAR', 'EXPORTAR', 'CONFIG'];

// Simular dados de monitoramento em tempo real
interface SystemMetrics {
    uptime: string;
    activeUsers: number;
    requestsPerMinute: number;
    avgResponseTime: number;
    dbConnections: number;
    memoryUsage: number;
}

// Métricas de workflow
interface WorkflowMetrics {
    totalSubmissions: number;
    approvalRate: number;
    averageProcessingTimeHours: number;
    delayCount: number;
    rejectionsByCategory: Record<string, number>;
    topDelayReasons: { motivo: string; count: number }[];
    mostActiveOperators: { id: string; nome: string; count: number }[];
}

export function Auditoria() {
    const { hasPermission } = useAuth();
    const isAdmin = useIsAdmin();
    const [searchTerm, setSearchTerm] = useState('');
    const [tipoFiltro, setTipoFiltro] = useState<LogTipo | ''>('');
    const [moduloFiltro, setModuloFiltro] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Novos filtros para workflow
    const [filterOperador, setFilterOperador] = useState('');
    const [filterSubmissionId, setFilterSubmissionId] = useState('');

    // Métricas de workflow
    const [workflowMetrics, setWorkflowMetrics] = useState<WorkflowMetrics>({
        totalSubmissions: 0,
        approvalRate: 0,
        averageProcessingTimeHours: 0,
        delayCount: 0,
        rejectionsByCategory: {},
        topDelayReasons: [],
        mostActiveOperators: [],
    });

    // Simular métricas de sistema
    const [metrics, setMetrics] = useState<SystemMetrics>({
        uptime: '99.97%',
        activeUsers: 12,
        requestsPerMinute: 847,
        avgResponseTime: 45,
        dbConnections: 8,
        memoryUsage: 62,
    });

    const canExport = hasPermission('exportAuditoria');
    const usuarios = getUsuarios();
    const logs = getLogs();

    // Buscar métricas de workflow do backend
    useEffect(() => {
        const fetchWorkflowMetrics = async () => {
            try {
                const response = await dashboardApi.auditMetrics({
                    operador: filterOperador || undefined,
                    submissionId: filterSubmissionId || undefined,
                });

                if (response.success && response.data) {
                    setWorkflowMetrics(response.data as WorkflowMetrics);
                }
            } catch (error) {
                console.error('Erro ao buscar métricas de workflow:', error);
            }
        };

        fetchWorkflowMetrics();
    }, [filterOperador, filterSubmissionId]);

    // Simular atualizações de métricas de sistema
    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics(prev => ({
                ...prev,
                activeUsers: Math.max(5, prev.activeUsers + Math.floor(Math.random() * 3) - 1),
                requestsPerMinute: Math.max(500, prev.requestsPerMinute + Math.floor(Math.random() * 100) - 50),
                avgResponseTime: Math.max(20, Math.min(100, prev.avgResponseTime + Math.floor(Math.random() * 10) - 5)),
            }));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Filtrar logs
    const logsFiltrados = useMemo(() => {
        return logs.filter(log => {
            const matchSearch = searchTerm === '' ||
                log.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.usuarioNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.modulo.toLowerCase().includes(searchTerm.toLowerCase());

            const matchTipo = tipoFiltro === '' || log.tipo === tipoFiltro;
            const matchModulo = moduloFiltro === '' || log.modulo.toLowerCase().includes(moduloFiltro.toLowerCase());

            return matchSearch && matchTipo && matchModulo;
        });
    }, [logs, searchTerm, tipoFiltro, moduloFiltro]);

    // Estatísticas
    const stats = useMemo(() => {
        const hoje = new Date().toISOString().split('T')[0];
        const logsHoje = logs.filter(log => log.timestamp.startsWith(hoje));

        return {
            total: logs.length,
            hoje: logsHoje.length,
            logins: logs.filter(log => log.tipo === 'LOGIN').length,
            acoes: logs.filter(log => ['CRIAR', 'EDITAR', 'DELETAR', 'APROVAR', 'REJEITAR'].includes(log.tipo)).length,
        };
    }, [logs]);

    // Top usuários ativos
    const topUsuarios = useMemo(() => {
        const contagem: Record<string, { nome: string, count: number }> = {};
        logs.forEach(log => {
            if (!contagem[log.usuarioId]) {
                contagem[log.usuarioId] = { nome: log.usuarioNome, count: 0 };
            }
            contagem[log.usuarioId].count++;
        });
        return Object.entries(contagem)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [logs]);

    // Atividade por hora (últimas 8 horas)
    const atividadePorHora = useMemo(() => {
        const horas: Record<number, number> = {};
        const agora = new Date();
        for (let i = 7; i >= 0; i--) {
            const hora = new Date(agora.getTime() - i * 60 * 60 * 1000).getHours();
            horas[hora] = 0;
        }
        logs.forEach(log => {
            const hora = new Date(log.timestamp).getHours();
            if (horas[hora] !== undefined) {
                horas[hora]++;
            }
        });
        return Object.entries(horas).map(([hora, count]) => ({
            hora: `${hora.padStart(2, '0')}h`,
            count,
        }));
    }, [logs]);

    const maxAtividade = Math.max(...atividadePorHora.map(h => h.count), 1);

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `Há ${diffMins}min`;
        if (diffHours < 24) return `Há ${diffHours}h`;

        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleExport = (format: 'json' | 'csv') => {
        if (format === 'json') {
            const dataStr = JSON.stringify(logsFiltrados, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `auditoria_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
        } else {
            const headers = ['Timestamp', 'Usuário', 'Tipo', 'Módulo', 'Descrição'];
            const rows = logsFiltrados.map(log => [
                log.timestamp,
                log.usuarioNome,
                log.tipo,
                log.modulo,
                log.descricao,
            ]);
            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };

    return (
        <div className="max-w-full mx-auto space-y-6 p-4 lg:p-6">
            {/* Header Premium */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-cyan-500/10" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <Shield className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-white">
                                Painel de Auditoria
                            </h1>
                            <p className="text-slate-400 text-sm lg:text-base">
                                Monitoramento e histórico de atividades em tempo real
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            className={`p-3 bg-slate-800/50 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        {canExport && (
                            <div className="relative group">
                                <button
                                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5"
                                >
                                    <Download className="w-5 h-5" />
                                    <span className="hidden sm:inline">Exportar</span>
                                </button>
                                <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                    <div className="bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                                        <button onClick={() => handleExport('json')} className="block w-full px-4 py-2 text-white hover:bg-white/10 text-left">
                                            Exportar JSON
                                        </button>
                                        <button onClick={() => handleExport('csv')} className="block w-full px-4 py-2 text-white hover:bg-white/10 text-left">
                                            Exportar CSV
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Métricas de Sistema - Grid Responsivo */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                <MetricCard
                    icon={Wifi}
                    label="Uptime"
                    value={metrics.uptime}
                    color="emerald"
                    trend="+0.02%"
                />
                <MetricCard
                    icon={Users}
                    label="Usuários Ativos"
                    value={metrics.activeUsers.toString()}
                    color="blue"
                    pulse
                />
                <MetricCard
                    icon={Zap}
                    label="Req/min"
                    value={metrics.requestsPerMinute.toString()}
                    color="purple"
                />
                <MetricCard
                    icon={Clock}
                    label="Latência"
                    value={`${metrics.avgResponseTime}ms`}
                    color="amber"
                />
                <MetricCard
                    icon={Database}
                    label="DB Conexões"
                    value={metrics.dbConnections.toString()}
                    color="cyan"
                />
                <MetricCard
                    icon={Server}
                    label="Memória"
                    value={`${metrics.memoryUsage}%`}
                    color="rose"
                    progress={metrics.memoryUsage}
                />
            </div>

            {/* Métricas de Workflow (Cadastros) - Grid com KPIs */}
            <div className="bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-white/10">
                        <BarChart3 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Métricas de Cadastros</h2>
                        <p className="text-sm text-slate-400">Estatísticas de aprovações, rejeições e atrasos</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <WorkflowMetricCard
                        icon={FileText}
                        label="Total de Cadastros"
                        value={workflowMetrics.totalSubmissions.toString()}
                        color="blue"
                    />
                    <WorkflowMetricCard
                        icon={Check}
                        label="Taxa de Aprovação"
                        value={`${workflowMetrics.approvalRate.toFixed(1)}%`}
                        color="emerald"
                        trend={workflowMetrics.approvalRate >= 80 ? 'up' : 'down'}
                    />
                    <WorkflowMetricCard
                        icon={Clock}
                        label="Tempo Médio (h)"
                        value={workflowMetrics.averageProcessingTimeHours.toFixed(1)}
                        color="amber"
                    />
                    <WorkflowMetricCard
                        icon={AlertCircle}
                        label="Atrasos Registrados"
                        value={workflowMetrics.delayCount.toString()}
                        color="rose"
                        pulse={workflowMetrics.delayCount > 0}
                    />
                </div>
            </div>

            {/* Estatísticas e Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Stats Cards */}
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
                    <StatCard
                        icon={Activity}
                        label="Total de Eventos"
                        value={stats.total}
                        color="blue"
                    />
                    <StatCard
                        icon={Clock}
                        label="Eventos Hoje"
                        value={stats.hoje}
                        color="emerald"
                    />
                    <StatCard
                        icon={LogIn}
                        label="Logins"
                        value={stats.logins}
                        color="purple"
                    />
                    <StatCard
                        icon={Edit}
                        label="Ações"
                        value={stats.acoes}
                        color="amber"
                    />
                </div>

                {/* Atividade por Hora */}
                <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4 lg:p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        <h3 className="text-sm font-semibold text-white">Atividade por Hora</h3>
                    </div>
                    <div className="flex items-end justify-between h-20 gap-1">
                        {atividadePorHora.map((item, i) => (
                            <div key={i} className="flex flex-col items-center flex-1">
                                <div
                                    className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t transition-all duration-500"
                                    style={{ height: `${(item.count / maxAtividade) * 100}%`, minHeight: '4px' }}
                                />
                                <span className="text-[10px] text-slate-500 mt-1">{item.hora}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Gráficos de Workflow - Rejeições e Atrasos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Rejeições por Categoria */}
                <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <XCircle className="w-5 h-5 text-red-400" />
                        <h3 className="text-sm font-semibold text-white">Rejeições por Categoria</h3>
                    </div>
                    {Object.keys(workflowMetrics.rejectionsByCategory).length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
                            Nenhuma rejeição registrada
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(workflowMetrics.rejectionsByCategory)
                                .sort(([, a], [, b]) => b - a)
                                .map(([categoria, count]) => {
                                    const maxCount = Math.max(...Object.values(workflowMetrics.rejectionsByCategory));
                                    const percentage = (count / maxCount) * 100;
                                    return (
                                        <div key={categoria}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-slate-300 capitalize">
                                                    {categoria.replace(/-/g, ' ')}
                                                </span>
                                                <span className="text-sm font-mono text-slate-400">{count}</span>
                                            </div>
                                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-red-500 to-rose-500 transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>

                {/* Principais Motivos de Atraso */}
                <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-amber-400" />
                        <h3 className="text-sm font-semibold text-white">Principais Motivos de Atraso</h3>
                    </div>
                    {workflowMetrics.topDelayReasons.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
                            Nenhum atraso registrado
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {workflowMetrics.topDelayReasons.map((reason, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-amber-500/20">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                                        {reason.count}
                                    </div>
                                    <p className="text-sm text-slate-300 flex-1 line-clamp-2">{reason.motivo}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Operadores mais ativos e Filtros */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
                {/* Top Operadores */}
                <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4 lg:p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Award className="w-5 h-5 text-amber-400" />
                        <h3 className="text-sm font-semibold text-white">Top Operadores Ativos</h3>
                    </div>
                    {workflowMetrics.mostActiveOperators.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                            Sem dados disponíveis
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {workflowMetrics.mostActiveOperators.slice(0, 5).map((operator, index) => (
                                <div key={operator.id} className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-500/20 text-amber-400' :
                                            index === 1 ? 'bg-slate-400/20 text-slate-300' :
                                                index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                                    'bg-slate-700/50 text-slate-500'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{operator.nome}</p>
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono">
                                        {operator.count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filtros */}
                <div className="lg:col-span-3 bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        {/* Busca */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por descrição, usuário ou módulo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                        </div>

                        {/* Toggle Filtros */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${showFilters
                                ? 'bg-blue-500/20 border-blue-500/30 text-white'
                                : 'bg-slate-900/50 border-white/10 text-slate-400 hover:text-white'
                                }`}
                        >
                            <Filter className="w-5 h-5" />
                            <span className="hidden sm:inline">Filtros</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Filtros Expandidos */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                            {/* Filtros de Workflow */}
                            <div>
                                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-400" />
                                    Filtros de Cadastros
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Nome do Operador</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Jordana"
                                            value={filterOperador}
                                            onChange={(e) => setFilterOperador(e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">ID do Cadastro</label>
                                        <input
                                            type="text"
                                            placeholder="UUID do cadastro"
                                            value={filterSubmissionId}
                                            onChange={(e) => setFilterSubmissionId(e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Filtros de Auditoria */}
                            <div>
                                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-purple-400" />
                                    Filtros de Auditoria
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Tipo de Ação</label>
                                        <select
                                            value={tipoFiltro}
                                            onChange={(e) => setTipoFiltro(e.target.value as LogTipo | '')}
                                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-all"
                                        >
                                            <option value="">Todos os tipos</option>
                                            {tiposDisponiveis.map(tipo => (
                                                <option key={tipo} value={tipo}>{tipo}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Módulo</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Autenticação"
                                            value={moduloFiltro}
                                            onChange={(e) => setModuloFiltro(e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            onClick={() => {
                                                setTipoFiltro('');
                                                setModuloFiltro('');
                                                setSearchTerm('');
                                                setFilterOperador('');
                                                setFilterSubmissionId('');
                                            }}
                                            className="w-full sm:w-auto px-4 py-2 text-slate-400 hover:text-white transition-colors border border-white/10 rounded-xl hover:bg-white/5"
                                        >
                                            Limpar Todos os Filtros
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Lista de Logs com Timeline */}
            <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-4 lg:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        Histórico de Atividades
                    </h2>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400">
                            {logsFiltrados.length} eventos
                        </span>
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-slate-500">Ao vivo</span>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                    {logsFiltrados.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-slate-500" />
                            </div>
                            <p className="text-slate-400 font-medium">Nenhum log encontrado</p>
                            <p className="text-sm text-slate-500 mt-1">Tente ajustar os filtros de busca</p>
                        </div>
                    ) : (
                        logsFiltrados.map((log, index) => (
                            <LogItem
                                key={log.id}
                                log={log}
                                isFirst={index === 0}
                                isLast={index === logsFiltrados.length - 1}
                                isExpanded={expandedLogId === log.id}
                                onToggle={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

function MetricCard({
    icon: Icon,
    label,
    value,
    color,
    trend,
    pulse,
    progress
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
    trend?: string;
    pulse?: boolean;
    progress?: number;
}) {
    const colorClasses = {
        emerald: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/20',
        blue: 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/20',
        purple: 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/20',
        amber: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/20',
        cyan: 'from-cyan-500/20 to-cyan-600/10 text-cyan-400 border-cyan-500/20',
        rose: 'from-rose-500/20 to-rose-600/10 text-rose-400 border-rose-500/20',
    }[color] || 'from-slate-500/20 to-slate-600/10 text-slate-400 border-slate-500/20';

    return (
        <div className={`relative overflow-hidden bg-gradient-to-br ${colorClasses} backdrop-blur-xl rounded-xl border p-3 lg:p-4`}>
            <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-white/5 ${pulse ? 'animate-pulse' : ''}`}>
                    <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                </div>
                {trend && (
                    <span className="text-xs text-emerald-400 flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />
                        {trend}
                    </span>
                )}
            </div>
            <div className="mt-2 lg:mt-3">
                <p className="text-lg lg:text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-400 truncate">{label}</p>
            </div>
            {progress !== undefined && (
                <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-current transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
    const colorClasses = {
        blue: 'bg-blue-500/20 text-blue-400',
        emerald: 'bg-emerald-500/20 text-emerald-400',
        purple: 'bg-purple-500/20 text-purple-400',
        amber: 'bg-amber-500/20 text-amber-400',
    }[color] || 'bg-slate-500/20 text-slate-400';

    return (
        <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${colorClasses}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xl lg:text-2xl font-bold text-white">{value}</p>
                    <p className="text-xs lg:text-sm text-slate-400">{label}</p>
                </div>
            </div>
        </div>
    );
}

function WorkflowMetricCard({
    icon: Icon,
    label,
    value,
    color,
    trend,
    pulse
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
    trend?: 'up' | 'down';
    pulse?: boolean;
}) {
    const colorClasses = {
        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    }[color] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';

    return (
        <div className={`bg-slate-900/50 backdrop-blur-xl rounded-xl border ${colorClasses} p-4`}>
            <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${colorClasses} ${pulse ? 'animate-pulse' : ''}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
        </div>
    );
}

function LogItem({
    log,
    isFirst,
    isLast,
    isExpanded,
    onToggle
}: {
    log: LogAuditoria;
    isFirst: boolean;
    isLast: boolean;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const Icon = tipoIcons[log.tipo] || Activity;
    const colorClass = tipoColors[log.tipo] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `Há ${diffMins}min`;
        if (diffHours < 24) return `Há ${diffHours}h`;

        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div
            className={`group relative p-4 hover:bg-white/5 transition-all cursor-pointer ${isExpanded ? 'bg-white/5' : ''}`}
            onClick={onToggle}
        >
            {/* Timeline Line */}
            <div className="absolute left-7 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-white/10" />

            <div className="flex items-start gap-4 relative">
                {/* Timeline Node */}
                <div className={`relative z-10 p-2.5 rounded-xl border ${colorClass} transition-transform group-hover:scale-110`}>
                    <Icon className="w-4 h-4" />
                    {isFirst && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                                {log.usuarioNome.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-white">{log.usuarioNome}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
                            {log.tipo}
                        </span>
                        <span className="text-slate-500 hidden sm:inline">•</span>
                        <span className="text-sm text-slate-400 hidden sm:inline">{log.modulo}</span>
                    </div>
                    <p className="text-slate-300 mt-1 text-sm lg:text-base">{log.descricao}</p>

                    {/* Detalhes Expandidos */}
                    {isExpanded && log.detalhes && (
                        <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-white/5 text-xs text-slate-400 font-mono overflow-x-auto">
                            <pre>{JSON.stringify(log.detalhes, null, 2)}</pre>
                        </div>
                    )}
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-sm text-slate-400 flex items-center gap-1 whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(log.timestamp)}
                    </p>
                    <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
            </div>
        </div>
    );
}
