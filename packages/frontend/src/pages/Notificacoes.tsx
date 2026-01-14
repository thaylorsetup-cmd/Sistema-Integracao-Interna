import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    Filter,
    Search,
    Clock,
    AlertCircle,
    AlertTriangle,
    Info,
    Package,
    FileText,
    Users,
    Truck,
    ArrowLeft,
    Eye,
} from 'lucide-react';

// Tipos de notificação
type NotificationType = 'success' | 'warning' | 'error' | 'info';
type NotificationCategory = 'sistema' | 'coleta' | 'cadastro' | 'auditoria' | 'frota';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    category: NotificationCategory;
    timestamp: string;
    read: boolean;
    actionUrl?: string;
}

// Mock de notificações
const generateNotifications = (): Notification[] => {
    const now = new Date();
    return [
        {
            id: '1',
            title: 'Nova carga registrada',
            message: 'Coleta COL-2024-008 foi registrada para Magazine Luiza com destino a São Paulo.',
            type: 'success',
            category: 'coleta',
            timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
            read: false,
            actionUrl: '/dashboard/operador',
        },
        {
            id: '2',
            title: 'Auditoria pendente',
            message: 'Existem 3 itens aguardando análise no módulo de cadastro GR.',
            type: 'warning',
            category: 'auditoria',
            timestamp: new Date(now.getTime() - 60 * 60000).toISOString(),
            read: false,
            actionUrl: '/auditoria',
        },
        {
            id: '3',
            title: 'Sistema atualizado',
            message: 'O sistema foi atualizado para a versão 2.1.0 com melhorias de performance.',
            type: 'info',
            category: 'sistema',
            timestamp: new Date(now.getTime() - 2 * 60 * 60000).toISOString(),
            read: true,
        },
        {
            id: '4',
            title: 'Motorista aprovado',
            message: 'João Silva Santos foi aprovado e já pode receber coletas.',
            type: 'success',
            category: 'cadastro',
            timestamp: new Date(now.getTime() - 3 * 60 * 60000).toISOString(),
            read: true,
            actionUrl: '/dashboard/cadastro-gr',
        },
        {
            id: '5',
            title: 'Documento vencendo',
            message: 'A CNH do motorista Pedro Santos vence em 5 dias. Solicite atualização.',
            type: 'warning',
            category: 'cadastro',
            timestamp: new Date(now.getTime() - 4 * 60 * 60000).toISOString(),
            read: false,
        },
        {
            id: '6',
            title: 'Veículo em manutenção',
            message: 'Caminhão ABC-1234 entrou em manutenção preventiva.',
            type: 'info',
            category: 'frota',
            timestamp: new Date(now.getTime() - 5 * 60 * 60000).toISOString(),
            read: true,
        },
        {
            id: '7',
            title: 'Erro de sincronização',
            message: 'Falha ao sincronizar dados com o ERP SSW. Tentativa automática em 5 minutos.',
            type: 'error',
            category: 'sistema',
            timestamp: new Date(now.getTime() - 6 * 60 * 60000).toISOString(),
            read: false,
        },
        {
            id: '8',
            title: 'Nova coleta urgente',
            message: 'Coleta COL-2024-009 marcada como URGENTE para Natura.',
            type: 'warning',
            category: 'coleta',
            timestamp: new Date(now.getTime() - 8 * 60 * 60000).toISOString(),
            read: true,
        },
        {
            id: '9',
            title: 'Usuário cadastrado',
            message: 'Novo usuário Maria Oliveira foi adicionado ao sistema.',
            type: 'success',
            category: 'sistema',
            timestamp: new Date(now.getTime() - 24 * 60 * 60000).toISOString(),
            read: true,
        },
        {
            id: '10',
            title: 'Backup concluído',
            message: 'Backup automático do banco de dados realizado com sucesso.',
            type: 'info',
            category: 'sistema',
            timestamp: new Date(now.getTime() - 48 * 60 * 60000).toISOString(),
            read: true,
        },
    ];
};

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string; bgColor: string }> = {
    success: { icon: Check, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    warning: { icon: AlertTriangle, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    error: { icon: AlertCircle, color: 'text-red-400', bgColor: 'bg-red-500/20' },
    info: { icon: Info, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
};

const categoryConfig: Record<NotificationCategory, { icon: React.ElementType; label: string }> = {
    sistema: { icon: Bell, label: 'Sistema' },
    coleta: { icon: Package, label: 'Coletas' },
    cadastro: { icon: Users, label: 'Cadastros' },
    auditoria: { icon: FileText, label: 'Auditoria' },
    frota: { icon: Truck, label: 'Frota' },
};

export function Notificacoes() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>(generateNotifications);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<NotificationType | ''>('');
    const [filterCategory, setFilterCategory] = useState<NotificationCategory | ''>('');
    const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');
    const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

    // Filtrar notificações
    const filteredNotifications = useMemo(() => {
        return notifications.filter(notif => {
            const matchSearch = searchTerm === '' ||
                notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                notif.message.toLowerCase().includes(searchTerm.toLowerCase());

            const matchType = filterType === '' || notif.type === filterType;
            const matchCategory = filterCategory === '' || notif.category === filterCategory;
            const matchRead = filterRead === 'all' ||
                (filterRead === 'read' && notif.read) ||
                (filterRead === 'unread' && !notif.read);

            return matchSearch && matchType && matchCategory && matchRead;
        });
    }, [notifications, searchTerm, filterType, filterCategory, filterRead]);

    // Estatísticas
    const stats = useMemo(() => ({
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        today: notifications.filter(n => {
            const today = new Date().toISOString().split('T')[0];
            return n.timestamp.startsWith(today);
        }).length,
    }), [notifications]);

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `Há ${diffMins}min`;
        if (diffHours < 24) return `Há ${diffHours}h`;
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `Há ${diffDays} dias`;

        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
        });
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setSelectedNotifications(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    const deleteSelected = () => {
        setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)));
        setSelectedNotifications(new Set());
    };

    const toggleSelect = (id: string) => {
        setSelectedNotifications(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const selectAll = () => {
        if (selectedNotifications.size === filteredNotifications.length) {
            setSelectedNotifications(new Set());
        } else {
            setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
        }
    };

    const handleNotificationClick = (notif: Notification) => {
        markAsRead(notif.id);
        if (notif.actionUrl) {
            navigate(notif.actionUrl);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-4 lg:p-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-cyan-500/10" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
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
                                {stats.unread} não lidas de {stats.total} total
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedNotifications.size > 0 && (
                            <button
                                onClick={deleteSelected}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Excluir ({selectedNotifications.size})</span>
                            </button>
                        )}
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                        >
                            <CheckCheck className="w-4 h-4" />
                            <span className="hidden sm:inline">Marcar todas como lidas</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-950/60 backdrop-blur-xl rounded-xl border border-white/10 p-4 text-center">
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                    <p className="text-xs text-slate-400">Total</p>
                </div>
                <div className="bg-slate-950/60 backdrop-blur-xl rounded-xl border border-white/10 p-4 text-center">
                    <p className="text-2xl font-bold text-amber-400">{stats.unread}</p>
                    <p className="text-xs text-slate-400">Não lidas</p>
                </div>
                <div className="bg-slate-950/60 backdrop-blur-xl rounded-xl border border-white/10 p-4 text-center">
                    <p className="text-2xl font-bold text-blue-400">{stats.today}</p>
                    <p className="text-xs text-slate-400">Hoje</p>
                </div>
            </div>

            {/* Filtros e Busca */}
            <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                    {/* Busca */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar notificações..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                    </div>

                    {/* Filtro de leitura */}
                    <div className="flex gap-2">
                        {(['all', 'unread', 'read'] as const).map(filter => (
                            <button
                                key={filter}
                                onClick={() => setFilterRead(filter)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterRead === filter
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'bg-slate-900/50 text-slate-400 border border-white/10 hover:text-white'
                                    }`}
                            >
                                {filter === 'all' ? 'Todas' : filter === 'unread' ? 'Não lidas' : 'Lidas'}
                            </button>
                        ))}
                    </div>

                    {/* Toggle Filtros Avançados */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${showFilters
                            ? 'bg-blue-500/20 border-blue-500/30 text-white'
                            : 'bg-slate-900/50 border-white/10 text-slate-400 hover:text-white'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filtros</span>
                    </button>
                </div>

                {/* Filtros Avançados */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Tipo</label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as NotificationType | '')}
                                className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none"
                            >
                                <option value="">Todos os tipos</option>
                                <option value="success">Sucesso</option>
                                <option value="warning">Aviso</option>
                                <option value="error">Erro</option>
                                <option value="info">Informação</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Categoria</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value as NotificationCategory | '')}
                                className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none"
                            >
                                <option value="">Todas as categorias</option>
                                {Object.entries(categoryConfig).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Lista de Notificações */}
            <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                {/* Header da Lista */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                            onChange={selectAll}
                            className="w-4 h-4 rounded bg-slate-900 border-white/20 text-blue-500 focus:ring-blue-500/20"
                        />
                        <span className="text-sm text-slate-400">
                            {filteredNotifications.length} notificações
                        </span>
                    </div>
                </div>

                {/* Lista */}
                <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                                <Bell className="w-8 h-8 text-slate-500" />
                            </div>
                            <p className="text-slate-400 font-medium">Nenhuma notificação encontrada</p>
                            <p className="text-sm text-slate-500 mt-1">Tente ajustar os filtros</p>
                        </div>
                    ) : (
                        filteredNotifications.map(notif => {
                            const typeInfo = typeConfig[notif.type];
                            const categoryInfo = categoryConfig[notif.category];
                            const TypeIcon = typeInfo.icon;
                            const CategoryIcon = categoryInfo.icon;

                            return (
                                <div
                                    key={notif.id}
                                    className={`group p-4 hover:bg-white/5 transition-all cursor-pointer ${!notif.read ? 'bg-blue-500/5' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={selectedNotifications.has(notif.id)}
                                            onChange={() => toggleSelect(notif.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="mt-1 w-4 h-4 rounded bg-slate-900 border-white/20 text-blue-500 focus:ring-blue-500/20"
                                        />

                                        {/* Ícone */}
                                        <div
                                            className={`p-2.5 rounded-xl ${typeInfo.bgColor} ${typeInfo.color}`}
                                            onClick={() => handleNotificationClick(notif)}
                                        >
                                            <TypeIcon className="w-5 h-5" />
                                        </div>

                                        {/* Conteúdo */}
                                        <div
                                            className="flex-1 min-w-0"
                                            onClick={() => handleNotificationClick(notif)}
                                        >
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className={`font-semibold ${notif.read ? 'text-slate-300' : 'text-white'}`}>
                                                    {notif.title}
                                                </h3>
                                                {!notif.read && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                                    <CategoryIcon className="w-3 h-3" />
                                                    {categoryInfo.label}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTimestamp(notif.timestamp)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Ações */}
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!notif.read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notif.id);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                    title="Marcar como lida"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notif.id);
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
