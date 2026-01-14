import { useState } from 'react';
import { useAuth, useIsAdmin } from '@/contexts';
import {
    Settings,
    User,
    Bell,
    Shield,
    Palette,
    Database,
    Users,
    Key,
    Globe,
    Save,
    Check,
    ChevronRight,
    Volume2,
    Moon,
    Sun,
    Monitor,
} from 'lucide-react';
import { getConfiguracaoUsuario, salvarConfiguracaoUsuario, getUsuarios } from '@/services/mockDatabase';
import type { ConfiguracaoUsuario, User as UserType } from '@/types';

interface TabConfig {
    id: string;
    label: string;
    icon: React.ElementType;
    adminOnly?: boolean;
}

const tabs: TabConfig[] = [
    { id: 'perfil', label: 'Meu Perfil', icon: User },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'aparencia', label: 'Aparência', icon: Palette },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'usuarios', label: 'Gerenciar Usuários', icon: Users, adminOnly: true },
    { id: 'sistema', label: 'Sistema', icon: Database, adminOnly: true },
    { id: 'integracoes', label: 'Integrações', icon: Globe, adminOnly: true },
];

export function Configuracoes() {
    const { user } = useAuth();
    const isAdmin = useIsAdmin();
    const [activeTab, setActiveTab] = useState('perfil');
    const [saved, setSaved] = useState(false);
    const [config, setConfig] = useState<ConfiguracaoUsuario>(() =>
        user ? getConfiguracaoUsuario(user.id) : {
            tema: 'dark',
            idioma: 'pt-BR',
            notificacoesEmail: true,
            notificacoesWhatsApp: true,
            notificacoesPush: true,
            somNotificacoes: true,
        }
    );

    const filteredTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

    const handleSave = () => {
        if (user) {
            salvarConfiguracaoUsuario(user.id, config);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'perfil':
                return <PerfilSection user={user} />;
            case 'notificacoes':
                return <NotificacoesSection config={config} setConfig={setConfig} />;
            case 'aparencia':
                return <AparenciaSection config={config} setConfig={setConfig} />;
            case 'seguranca':
                return <SegurancaSection />;
            case 'usuarios':
                return isAdmin ? <UsuariosSection /> : null;
            case 'sistema':
                return isAdmin ? <SistemaSection /> : null;
            case 'integracoes':
                return isAdmin ? <IntegracoesSection /> : null;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <div className="p-3 bg-benfica-blue/20 rounded-xl">
                            <Settings className="w-8 h-8 text-benfica-blue" />
                        </div>
                        Configurações
                    </h1>
                    <p className="mt-2 text-slate-400">
                        {isAdmin ? 'Gerencie todas as configurações do sistema' : 'Personalize suas preferências'}
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-benfica-blue to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-benfica-blue/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                    {saved ? (
                        <>
                            <Check className="w-5 h-5" />
                            Salvo!
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Salvar Alterações
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar de Navegação */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4 space-y-2">
                        {filteredTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-benfica-blue/20 text-white border border-benfica-blue/30'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-benfica-blue' : ''}`} />
                                <span className="font-medium">{tab.label}</span>
                                {tab.adminOnly && (
                                    <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                                        Admin
                                    </span>
                                )}
                                <ChevronRight className={`w-4 h-4 ml-auto ${activeTab === tab.id ? 'text-benfica-blue' : 'text-slate-600'}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Conteúdo Principal */}
                <div className="lg:col-span-3">
                    <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// SEÇÕES DE CONFIGURAÇÃO
// ============================================================================

function PerfilSection({ user }: { user: UserType | null }) {
    if (!user) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-benfica-blue" />
                Meu Perfil
            </h2>

            <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-benfica-blue to-blue-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-benfica-blue/30">
                    {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white">{user.name}</h3>
                    <p className="text-slate-400">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-400' :
                            user.role === 'gestor' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-benfica-blue/20 text-benfica-blue'
                            }`}>
                            {user.role.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs bg-slate-800 text-slate-400">
                            {user.departamento}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Nome</label>
                    <input
                        type="text"
                        value={user.name}
                        readOnly
                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                    <input
                        type="email"
                        value={user.email}
                        readOnly
                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Telefone</label>
                    <input
                        type="tel"
                        value={user.telefone || ''}
                        readOnly
                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Departamento</label>
                    <input
                        type="text"
                        value={user.departamento}
                        readOnly
                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white"
                    />
                </div>
            </div>
        </div>
    );
}

function NotificacoesSection({ config, setConfig }: { config: ConfiguracaoUsuario; setConfig: (c: ConfiguracaoUsuario) => void }) {
    const toggles = [
        { key: 'notificacoesEmail', label: 'Notificações por Email', description: 'Receba alertas importantes no seu email' },
        { key: 'notificacoesWhatsApp', label: 'Notificações por WhatsApp', description: 'Alertas urgentes direto no seu WhatsApp' },
        { key: 'notificacoesPush', label: 'Notificações Push', description: 'Notificações no navegador em tempo real' },
        { key: 'somNotificacoes', label: 'Som de Notificações', description: 'Reproduzir som ao receber notificações' },
    ] as const;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-benfica-blue" />
                Notificações
            </h2>

            <div className="space-y-4">
                {toggles.map(toggle => (
                    <div key={toggle.key} className="flex items-center justify-between p-4 bg-slate-900/30 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Volume2 className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="font-medium text-white">{toggle.label}</p>
                                <p className="text-sm text-slate-400">{toggle.description}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setConfig({ ...config, [toggle.key]: !config[toggle.key] })}
                            className={`w-12 h-6 rounded-full transition-colors duration-300 ${config[toggle.key] ? 'bg-benfica-blue' : 'bg-slate-700'
                                }`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${config[toggle.key] ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AparenciaSection({ config, setConfig }: { config: ConfiguracaoUsuario; setConfig: (c: ConfiguracaoUsuario) => void }) {
    const temas = [
        { value: 'dark', label: 'Escuro', icon: Moon },
        { value: 'light', label: 'Claro', icon: Sun },
        { value: 'system', label: 'Sistema', icon: Monitor },
    ] as const;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-benfica-blue" />
                Aparência
            </h2>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">Tema</label>
                <div className="flex gap-3">
                    {temas.map(tema => (
                        <button
                            key={tema.value}
                            onClick={() => setConfig({ ...config, tema: tema.value })}
                            className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-300 ${config.tema === tema.value
                                ? 'bg-benfica-blue/20 border-benfica-blue/50 text-white'
                                : 'bg-slate-900/30 border-white/10 text-slate-400 hover:bg-slate-900/50'
                                }`}
                        >
                            <tema.icon className="w-5 h-5" />
                            <span className="font-medium">{tema.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">Idioma</label>
                <select
                    value={config.idioma}
                    onChange={(e) => setConfig({ ...config, idioma: e.target.value as ConfiguracaoUsuario['idioma'] })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white"
                >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                </select>
            </div>
        </div>
    );
}

function SegurancaSection() {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-benfica-blue" />
                Segurança
            </h2>

            <div className="space-y-4">
                <div className="p-4 bg-slate-900/30 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <Key className="w-5 h-5 text-benfica-blue" />
                        <div>
                            <p className="font-medium text-white">Alterar Senha</p>
                            <p className="text-sm text-slate-400">Atualize sua senha de acesso</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <input
                            type="password"
                            placeholder="Senha atual"
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500"
                        />
                        <input
                            type="password"
                            placeholder="Nova senha"
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500"
                        />
                        <input
                            type="password"
                            placeholder="Confirmar nova senha"
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500"
                        />
                        <button className="px-6 py-2 bg-benfica-blue text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
                            Atualizar Senha
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-slate-900/30 rounded-xl">
                    <p className="font-medium text-white mb-2">Sessões Ativas</p>
                    <p className="text-sm text-slate-400 mb-4">Gerencie suas sessões de login</p>
                    <div className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-white">Sessão Atual</p>
                            <p className="text-xs text-slate-400">Windows • Chrome • Agora</p>
                        </div>
                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function UsuariosSection() {
    const [usuarios, setUsuarios] = useState(() => getUsuarios());
    const [search, setSearch] = useState('');
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [page, setPage] = useState(0);
    const perPage = 8;

    const filteredUsuarios = usuarios.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.departamento.toLowerCase().includes(search.toLowerCase())
    );

    const paginatedUsuarios = filteredUsuarios.slice(page * perPage, (page + 1) * perPage);
    const totalPages = Math.ceil(filteredUsuarios.length / perPage);

    const handleToggleAtivo = (userId: string) => {
        setUsuarios(prev => prev.map(u =>
            u.id === userId ? { ...u, ativo: !u.ativo } : u
        ));
    };

    const handleUpdateRole = (userId: string, newRole: UserType['role']) => {
        setUsuarios(prev => prev.map(u =>
            u.id === userId ? { ...u, role: newRole } : u
        ));
        setEditingUser(null);
    };

    const roleOptions: { value: UserType['role']; label: string; color: string }[] = [
        { value: 'admin', label: 'Administrador', color: 'bg-amber-500/20 text-amber-400' },
        { value: 'gestor', label: 'Gestor', color: 'bg-purple-500/20 text-purple-400' },
        { value: 'operacional', label: 'Operacional', color: 'bg-blue-500/20 text-blue-400' },
        { value: 'cadastro', label: 'Cadastro', color: 'bg-emerald-500/20 text-emerald-400' },
        { value: 'comercial', label: 'Comercial', color: 'bg-cyan-500/20 text-cyan-400' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-benfica-blue" />
                    Gerenciar Usuários
                </h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar usuário..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        className="pl-10 pr-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 w-full sm:w-64"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/30 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white">{usuarios.length}</p>
                    <p className="text-xs text-slate-400">Total</p>
                </div>
                <div className="bg-slate-900/30 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{usuarios.filter(u => u.ativo).length}</p>
                    <p className="text-xs text-slate-400">Ativos</p>
                </div>
                <div className="bg-slate-900/30 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-amber-400">{usuarios.filter(u => u.role === 'admin').length}</p>
                    <p className="text-xs text-slate-400">Admins</p>
                </div>
                <div className="bg-slate-900/30 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-red-400">{usuarios.filter(u => !u.ativo).length}</p>
                    <p className="text-xs text-slate-400">Inativos</p>
                </div>
            </div>

            {/* Tabela de Usuários */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Usuário</th>
                            <th className="text-left py-3 px-4 text-slate-400 font-medium hidden md:table-cell">Departamento</th>
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Role</th>
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                            <th className="text-right py-3 px-4 text-slate-400 font-medium">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsuarios.map(usuario => (
                            <tr key={usuario.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                            {usuario.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{usuario.name}</p>
                                            <p className="text-xs text-slate-400">{usuario.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-slate-400 hidden md:table-cell">{usuario.departamento}</td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${roleOptions.find(r => r.value === usuario.role)?.color
                                        }`}>
                                        {usuario.role}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <button
                                        onClick={() => handleToggleAtivo(usuario.id)}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${usuario.ativo
                                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                            }`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${usuario.ativo ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                                    </button>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <button
                                        onClick={() => setEditingUser(usuario)}
                                        className="px-3 py-1.5 bg-benfica-blue/20 text-benfica-blue rounded-lg text-xs font-medium hover:bg-benfica-blue/30 transition-colors"
                                    >
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                    Mostrando {page * perPage + 1}-{Math.min((page + 1) * perPage, filteredUsuarios.length)} de {filteredUsuarios.length}
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-700 transition-colors"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-700 transition-colors"
                    >
                        Próximo
                    </button>
                </div>
            </div>

            {/* Modal de Edição */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">Editar Usuário</h3>

                        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-800/50 rounded-xl">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                                {editingUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-white font-semibold">{editingUser.name}</p>
                                <p className="text-sm text-slate-400">{editingUser.email}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Departamento</label>
                                <input
                                    type="text"
                                    value={editingUser.departamento}
                                    readOnly
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-slate-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Role / Permissão</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserType['role'] })}
                                    className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-white"
                                >
                                    {roleOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 px-4 py-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleUpdateRole(editingUser.id, editingUser.role)}
                                className="flex-1 px-4 py-2 bg-benfica-blue text-white rounded-xl hover:bg-blue-600 transition-colors"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SistemaSection() {
    const [systemConfig, setSystemConfig] = useState({
        // Empresa
        nomeEmpresa: 'BBT Transportes',
        cnpj: '12.345.678/0001-99',
        emailSuporte: 'suporte@bbttransportes.com.br',
        whatsappSuporte: '+55 62 99989-2013',
        // Operação
        horaInicioOperacao: '06:00',
        horaFimOperacao: '22:00',
        diasOperacao: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
        fusoHorario: 'America/Sao_Paulo',
        // Segurança
        sessaoTimeout: 30,
        tentativasLogin: 5,
        requerMFA: false,
        forcaSenha: 'media',
        // Backup
        backupAutomatico: true,
        frequenciaBackup: 'diario',
        retencaoBackup: 30,
        // Sistema
        modoManutencao: false,
        logLevel: 'info',
        debugMode: false,
    });

    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const diasSemana = [
        { id: 'dom', label: 'D' },
        { id: 'seg', label: 'S' },
        { id: 'ter', label: 'T' },
        { id: 'qua', label: 'Q' },
        { id: 'qui', label: 'Q' },
        { id: 'sex', label: 'S' },
        { id: 'sab', label: 'S' },
    ];

    const toggleDia = (dia: string) => {
        setSystemConfig(prev => ({
            ...prev,
            diasOperacao: prev.diasOperacao.includes(dia)
                ? prev.diasOperacao.filter(d => d !== dia)
                : [...prev.diasOperacao, dia]
        }));
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-benfica-blue" />
                    Configurações do Sistema
                </h2>
                <button
                    onClick={handleSave}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${saved
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-benfica-blue text-white hover:bg-blue-600'
                        }`}
                >
                    {saved ? '✓ Salvo!' : 'Salvar Configurações'}
                </button>
            </div>

            {/* Status do Sistema */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
                    <p className="text-xs text-emerald-400 font-medium">Sistema</p>
                    <p className="text-lg font-bold text-emerald-400">Online</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center">
                    <p className="text-xs text-blue-400 font-medium">Versão</p>
                    <p className="text-lg font-bold text-blue-400">2.1.0</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 text-center">
                    <p className="text-xs text-purple-400 font-medium">Uptime</p>
                    <p className="text-lg font-bold text-purple-400">99.9%</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                    <p className="text-xs text-amber-400 font-medium">Último Backup</p>
                    <p className="text-lg font-bold text-amber-400">Hoje 03:00</p>
                </div>
            </div>

            {/* Informações da Empresa */}
            <div className="p-4 bg-slate-900/30 rounded-xl space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Informações da Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Nome da Empresa</label>
                        <input
                            type="text"
                            value={systemConfig.nomeEmpresa}
                            onChange={(e) => setSystemConfig({ ...systemConfig, nomeEmpresa: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">CNPJ</label>
                        <input
                            type="text"
                            value={systemConfig.cnpj}
                            onChange={(e) => setSystemConfig({ ...systemConfig, cnpj: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Email de Suporte</label>
                        <input
                            type="email"
                            value={systemConfig.emailSuporte}
                            onChange={(e) => setSystemConfig({ ...systemConfig, emailSuporte: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">WhatsApp Suporte</label>
                        <input
                            type="tel"
                            value={systemConfig.whatsappSuporte}
                            onChange={(e) => setSystemConfig({ ...systemConfig, whatsappSuporte: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Configurações de Operação */}
            <div className="p-4 bg-slate-900/30 rounded-xl space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Operação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Horário de Operação</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="time"
                                value={systemConfig.horaInicioOperacao}
                                onChange={(e) => setSystemConfig({ ...systemConfig, horaInicioOperacao: e.target.value })}
                                className="flex-1 px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white"
                            />
                            <span className="text-slate-400">às</span>
                            <input
                                type="time"
                                value={systemConfig.horaFimOperacao}
                                onChange={(e) => setSystemConfig({ ...systemConfig, horaFimOperacao: e.target.value })}
                                className="flex-1 px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Fuso Horário</label>
                        <select
                            value={systemConfig.fusoHorario}
                            onChange={(e) => setSystemConfig({ ...systemConfig, fusoHorario: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white"
                        >
                            <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                            <option value="America/Manaus">Manaus (GMT-4)</option>
                            <option value="America/Belem">Belém (GMT-3)</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Dias de Operação</label>
                    <div className="flex gap-2">
                        {diasSemana.map((dia) => (
                            <button
                                key={dia.id}
                                onClick={() => toggleDia(dia.id)}
                                className={`w-10 h-10 rounded-lg font-medium transition-all ${systemConfig.diasOperacao.includes(dia.id)
                                    ? 'bg-benfica-blue text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                {dia.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Segurança */}
            <div className="p-4 bg-slate-900/30 rounded-xl space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Segurança</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Timeout de Sessão (minutos)</label>
                        <input
                            type="number"
                            value={systemConfig.sessaoTimeout}
                            onChange={(e) => setSystemConfig({ ...systemConfig, sessaoTimeout: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Tentativas de Login</label>
                        <input
                            type="number"
                            value={systemConfig.tentativasLogin}
                            onChange={(e) => setSystemConfig({ ...systemConfig, tentativasLogin: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Força da Senha</label>
                        <select
                            value={systemConfig.forcaSenha}
                            onChange={(e) => setSystemConfig({ ...systemConfig, forcaSenha: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white"
                        >
                            <option value="baixa">Baixa (6+ caracteres)</option>
                            <option value="media">Média (8+ com números)</option>
                            <option value="alta">Alta (12+ com especiais)</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                        <div>
                            <p className="font-medium text-white">Autenticação 2FA</p>
                            <p className="text-sm text-slate-400">Requer segundo fator</p>
                        </div>
                        <button
                            onClick={() => setSystemConfig({ ...systemConfig, requerMFA: !systemConfig.requerMFA })}
                            className={`w-12 h-6 rounded-full transition-colors ${systemConfig.requerMFA ? 'bg-benfica-blue' : 'bg-slate-600'
                                }`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${systemConfig.requerMFA ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Backup */}
            <div className="p-4 bg-slate-900/30 rounded-xl space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Backup & Dados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                        <div>
                            <p className="font-medium text-white">Backup Automático</p>
                            <p className="text-sm text-slate-400">Salvar dados periodicamente</p>
                        </div>
                        <button
                            onClick={() => setSystemConfig({ ...systemConfig, backupAutomatico: !systemConfig.backupAutomatico })}
                            className={`w-12 h-6 rounded-full transition-colors ${systemConfig.backupAutomatico ? 'bg-emerald-500' : 'bg-slate-600'
                                }`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${systemConfig.backupAutomatico ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Frequência</label>
                        <select
                            value={systemConfig.frequenciaBackup}
                            onChange={(e) => setSystemConfig({ ...systemConfig, frequenciaBackup: e.target.value })}
                            disabled={!systemConfig.backupAutomatico}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white disabled:opacity-50"
                        >
                            <option value="horario">A cada hora</option>
                            <option value="diario">Diário (03:00)</option>
                            <option value="semanal">Semanal</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Retenção (dias)</label>
                        <input
                            type="number"
                            value={systemConfig.retencaoBackup}
                            onChange={(e) => setSystemConfig({ ...systemConfig, retencaoBackup: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex-1 px-4 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl font-medium hover:bg-emerald-500/30 transition-colors">
                            Backup Manual
                        </button>
                        <button className="flex-1 px-4 py-3 bg-blue-500/20 text-blue-400 rounded-xl font-medium hover:bg-blue-500/30 transition-colors">
                            Restaurar
                        </button>
                    </div>
                </div>
            </div>

            {/* Manutenção */}
            <div className="p-4 bg-slate-900/30 rounded-xl space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Manutenção</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                        <div>
                            <p className="font-medium text-white">Modo Manutenção</p>
                            <p className="text-sm text-slate-400">Bloqueia acesso de usuários</p>
                        </div>
                        <button
                            onClick={() => setSystemConfig({ ...systemConfig, modoManutencao: !systemConfig.modoManutencao })}
                            className={`w-12 h-6 rounded-full transition-colors ${systemConfig.modoManutencao ? 'bg-red-500' : 'bg-slate-600'
                                }`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${systemConfig.modoManutencao ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                        <div>
                            <p className="font-medium text-white">Modo Debug</p>
                            <p className="text-sm text-slate-400">Logs detalhados</p>
                        </div>
                        <button
                            onClick={() => setSystemConfig({ ...systemConfig, debugMode: !systemConfig.debugMode })}
                            className={`w-12 h-6 rounded-full transition-colors ${systemConfig.debugMode ? 'bg-amber-500' : 'bg-slate-600'
                                }`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${systemConfig.debugMode ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Nível de Log</label>
                        <select
                            value={systemConfig.logLevel}
                            onChange={(e) => setSystemConfig({ ...systemConfig, logLevel: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white"
                        >
                            <option value="error">Apenas Erros</option>
                            <option value="warn">Avisos e Erros</option>
                            <option value="info">Informações</option>
                            <option value="debug">Debug (Completo)</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex-1 px-4 py-3 bg-amber-500/20 text-amber-400 rounded-xl font-medium hover:bg-amber-500/30 transition-colors">
                            Limpar Cache
                        </button>
                        <button className="flex-1 px-4 py-3 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-colors">
                            Reset Config
                        </button>
                    </div>
                </div>
            </div>

            {/* Alert */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-amber-400 font-medium">⚠️ Área Restrita</p>
                <p className="text-sm text-slate-400 mt-1">
                    Alterações aqui afetam todo o sistema. Tenha cuidado ao modificar estas configurações.
                </p>
            </div>
        </div>
    );
}

function IntegracoesSection() {
    const integracoes = [
        { nome: 'SSW ERP', status: 'conectado', descricao: 'Sistema de gestão empresarial' },
        { nome: 'WhatsApp API', status: 'conectado', descricao: 'Evolution API para notificações' },
        { nome: 'n8n Automations', status: 'conectado', descricao: 'Fluxos de automação' },
        { nome: 'PostgreSQL', status: 'conectado', descricao: 'Banco de dados principal' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-benfica-blue" />
                Integrações
            </h2>

            <div className="space-y-3">
                {integracoes.map(integ => (
                    <div key={integ.nome} className="p-4 bg-slate-900/30 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="font-medium text-white">{integ.nome}</p>
                            <p className="text-sm text-slate-400">{integ.descricao}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                            <span className="text-sm text-emerald-400 font-medium capitalize">{integ.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
