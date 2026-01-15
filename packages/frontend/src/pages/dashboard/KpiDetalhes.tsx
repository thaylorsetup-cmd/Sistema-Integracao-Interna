import { useParams, useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout';
import {
    ArrowLeft,
    DollarSign,
    TrendingUp,
    Activity,
    Wallet,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    RefreshCcw,
    Filter
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';

// Tipos para os KPIs
type KpiType = 'receita' | 'entregas' | 'eficiencia' | 'custos';

interface KpiConfig {
    title: string;
    subtitle: string;
    color: string;
    gradient: string;
    icon: React.ReactNode;
    unit: string;
}

const kpiConfigs: Record<KpiType, KpiConfig> = {
    receita: {
        title: 'Receita Mensal',
        subtitle: 'Análise detalhada de faturamento',
        color: 'emerald',
        gradient: 'from-emerald-500 to-emerald-700',
        icon: <DollarSign className="h-6 w-6 text-white" />,
        unit: 'R$'
    },
    entregas: {
        title: 'Entregas do Mês',
        subtitle: 'Análise detalhada de entregas realizadas',
        color: 'blue',
        gradient: 'from-benfica-blue to-blue-700',
        icon: <TrendingUp className="h-6 w-6 text-white" />,
        unit: ''
    },
    eficiencia: {
        title: 'Eficiência Operacional',
        subtitle: 'Análise detalhada de eficiência',
        color: 'purple',
        gradient: 'from-purple-500 to-purple-700',
        icon: <Activity className="h-6 w-6 text-white" />,
        unit: '%'
    },
    custos: {
        title: 'Custos Operacionais',
        subtitle: 'Análise detalhada de custos',
        color: 'red',
        gradient: 'from-benfica-red to-red-700',
        icon: <Wallet className="h-6 w-6 text-white" />,
        unit: 'R$'
    }
};

// Dados mockados - serão substituídos por dados do backend
const mockChartData = [
    { mes: 'Ago', atual: 180000, anterior: 165000 },
    { mes: 'Set', atual: 195000, anterior: 175000 },
    { mes: 'Out', atual: 210000, anterior: 190000 },
    { mes: 'Nov', atual: 225000, anterior: 205000 },
    { mes: 'Dez', atual: 235000, anterior: 215000 },
    { mes: 'Jan', atual: 245000, anterior: 220000 },
];

const mockBreakdownData = [
    { categoria: 'Sudeste', valor: 85000, porcentagem: 35 },
    { categoria: 'Centro-Oeste', valor: 65000, porcentagem: 27 },
    { categoria: 'Sul', valor: 48000, porcentagem: 20 },
    { categoria: 'Nordeste', valor: 32000, porcentagem: 13 },
    { categoria: 'Norte', valor: 15000, porcentagem: 5 },
];

const mockRecentActivity = [
    { id: 1, descricao: 'Entrega concluída - SP-001', valor: 'R$ 2.500', tempo: 'há 5 min', status: 'success' },
    { id: 2, descricao: 'Nova rota registrada - GO-045', valor: 'R$ 1.800', tempo: 'há 12 min', status: 'success' },
    { id: 3, descricao: 'Custo adicional - ManutenÃ§Ã£o', valor: '-R$ 450', tempo: 'há 25 min', status: 'warning' },
    { id: 4, descricao: 'Entrega concluída - DF-012', valor: 'R$ 3.200', tempo: 'há 1 hora', status: 'success' },
    { id: 5, descricao: 'Reembolso processado', valor: '-R$ 180', tempo: 'há 2 horas', status: 'error' },
];

export function KpiDetalhes() {
    const { tipo } = useParams<{ tipo: string }>();
    const navigate = useNavigate();

    const kpiType = (tipo || 'receita') as KpiType;
    const config = kpiConfigs[kpiType] || kpiConfigs.receita;

    // TODO: Substituir por hook de API (useQuery) quando backend estiver pronto
    // const { data: kpiData, isLoading } = useKpiDetails(kpiType);
    const isLoading = false;

    const mockCurrentValue = {
        receita: 'R$ 245.000',
        entregas: '342',
        eficiencia: '96,5%',
        custos: 'R$ 98.000'
    }[kpiType];

    const mockVariation = {
        receita: { value: '+12%', positive: true },
        entregas: { value: '+8%', positive: true },
        eficiencia: { value: '+2.3%', positive: true },
        custos: { value: '+5%', positive: false }
    }[kpiType];

    if (isLoading) {
        return (
            <Container>
                <div className="flex items-center justify-center h-96">
                    <RefreshCcw className="w-8 h-8 text-benfica-blue animate-spin" />
                </div>
            </Container>
        );
    }

    return (
        <Container>
            <div className="space-y-6">
                {/* Header com navegação */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard/gestao')}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-white flex items-center gap-3">
                                <div className={`p-2.5 bg-gradient-to-br ${config.gradient} rounded-xl shadow-lg border border-white/20`}>
                                    {config.icon}
                                </div>
                                {config.title}
                            </h1>
                            <p className="mt-1 text-slate-400 font-medium">
                                {config.subtitle}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-400 transition-all">
                            <Filter className="w-4 h-4" />
                            Filtros
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-400 transition-all">
                            <Calendar className="w-4 h-4" />
                            Período
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-benfica-blue hover:bg-benfica-blue/80 rounded-xl text-white font-medium transition-all">
                            <Download className="w-4 h-4" />
                            Exportar
                        </button>
                    </div>
                </div>

                {/* Cards de resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Valor Atual */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <p className="text-sm text-slate-400 font-medium">Valor Atual</p>
                        <p className="text-4xl font-black text-white mt-2">{mockCurrentValue}</p>
                        <div className={`flex items-center gap-1 mt-2 text-sm font-bold ${mockVariation.positive ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                            {mockVariation.positive ? (
                                <ArrowUpRight className="w-4 h-4" />
                            ) : (
                                <ArrowDownRight className="w-4 h-4" />
                            )}
                            {mockVariation.value} vs mês anterior
                        </div>
                    </div>

                    {/* Meta do Mês */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <p className="text-sm text-slate-400 font-medium">Meta do Mês</p>
                        <p className="text-4xl font-black text-white mt-2">
                            {kpiType === 'receita' ? 'R$ 250.000' :
                                kpiType === 'entregas' ? '350' :
                                    kpiType === 'eficiencia' ? '95%' : 'R$ 90.000'}
                        </p>
                        <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-500">Progresso</span>
                                <span className="text-white font-bold">
                                    {kpiType === 'receita' ? '98%' :
                                        kpiType === 'entregas' ? '97.7%' :
                                            kpiType === 'eficiencia' ? '101.5%' : '108.8%'}
                                </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2">
                                <div
                                    className={`bg-gradient-to-r ${config.gradient} h-2 rounded-full transition-all`}
                                    style={{ width: kpiType === 'custos' ? '100%' : '98%' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Projeção */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <p className="text-sm text-slate-400 font-medium">Projeção Final do Mês</p>
                        <p className="text-4xl font-black text-white mt-2">
                            {kpiType === 'receita' ? 'R$ 268.000' :
                                kpiType === 'entregas' ? '372' :
                                    kpiType === 'eficiencia' ? '97.2%' : 'R$ 102.000'}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                            Baseado na tendência atual
                        </p>
                    </div>
                </div>

                {/* Gráfico de Evolução */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">Evolução Mensal</h3>
                            <p className="text-sm text-slate-400">Comparativo com período anterior</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-benfica-blue" />
                                <span className="text-slate-400">Período Atual</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-slate-500" />
                                <span className="text-slate-400">Período Anterior</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={mockChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="mes" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '12px'
                                    }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="atual"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    dot={{ fill: '#2563eb', strokeWidth: 2 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="anterior"
                                    stroke="#64748b"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ fill: '#64748b', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Grid de detalhamento */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Breakdown por Região */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/10">
                            <h3 className="text-lg font-bold text-white">Distribuição por Região</h3>
                        </div>
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={mockBreakdownData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis type="number" stroke="#64748b" />
                                    <YAxis dataKey="categoria" type="category" stroke="#64748b" width={100} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '12px'
                                        }}
                                    />
                                    <Bar dataKey="valor" fill="#2563eb" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Atividade Recente */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Atividade Recente</h3>
                            <button className="text-sm text-benfica-blue hover:underline">Ver todas</button>
                        </div>
                        <div className="divide-y divide-white/5">
                            {mockRecentActivity.map((activity) => (
                                <div key={activity.id} className="p-4 hover:bg-white/5 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-white">{activity.descricao}</p>
                                            <p className="text-xs text-slate-500 mt-1">{activity.tempo}</p>
                                        </div>
                                        <span className={`text-sm font-bold ${activity.status === 'success' ? 'text-emerald-400' :
                                                activity.status === 'warning' ? 'text-amber-400' : 'text-red-400'
                                            }`}>
                                            {activity.valor}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Aviso de dados mockados */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-sm text-amber-400">
                        ⚠️ <strong>Dados de demonstração:</strong> Esta página está preparada para receber dados reais do backend.
                        Quando o backend estiver configurado, substitua os dados mockados por chamadas à API.
                    </p>
                </div>
            </div>
        </Container>
    );
}
