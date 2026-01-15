import { useState } from 'react';
import { Container } from '@/components/layout';
import {
    FileSearch,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Eye,
    User,
    Truck,
    FileText,
    MessageSquare,
    ChevronRight,
    X,
    Phone,
    MapPin,
    Package,
    DollarSign,
    Calendar,
    Image as ImageIcon,
    Download,
    Copy,
    Check,
    ExternalLink,
    Shield,
    CreditCard,
    FileCheck
} from 'lucide-react';

// Tipos de documentos (igual ao DashboardOperador)
const DOCUMENT_TYPES = [
    { id: 'crlv', label: "CRLV's", color: 'blue' },
    { id: 'antt', label: 'ANTT', color: 'purple' },
    { id: 'cnh', label: 'CNH', color: 'emerald' },
    { id: 'endereco', label: 'Endereço', color: 'amber' },
    { id: 'bancario', label: 'Bancário', color: 'cyan' },
    { id: 'pamcard', label: 'PAMCARD', color: 'orange' },
    { id: 'gr', label: 'GR', color: 'red' },
    { id: 'rcv', label: 'RCV', color: 'indigo' },
    { id: 'outros', label: 'Outros', color: 'pink' },
];

const DOC_COLORS: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-400' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-400' },
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-400' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-400' },
    cyan: { bg: 'bg-cyan-500', text: 'text-cyan-400' },
    green: { bg: 'bg-green-500', text: 'text-green-400' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-400' },
    red: { bg: 'bg-red-500', text: 'text-red-400' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-400' },
    pink: { bg: 'bg-pink-500', text: 'text-pink-400' },
    slate: { bg: 'bg-slate-500', text: 'text-slate-400' },
};

interface DocumentFile {
    id: string;
    type: string;
    customDescription?: string;
    filename: string;
    url: string; // URL para download
}

interface Submission {
    id: number;
    operador: string;
    dataEnvio: string;
    horaEnvio: string;
    status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';
    documentos: DocumentFile[];
    tempoEspera: string;
    prioridade: 'normal' | 'alta' | 'urgente';
}

// Mock data baseado no novo sistema de documentos
const MOCK_SUBMISSIONS: Submission[] = [
    {
        id: 1,
        operador: 'Thaylor Operacional',
        dataEnvio: '14/01/2026',
        horaEnvio: '15:05',
        status: 'pendente',
        tempoEspera: '5 min',
        prioridade: 'urgente',
        documentos: [
            { id: '1', type: 'cnh', filename: 'cnh_joao_silva.pdf', url: '#' },
            { id: '2', type: 'crlv', filename: 'crlv_cavalo_GOI2B34.jpg', url: '#' },
            { id: '3', type: 'crlv', filename: 'crlv_carreta_TRK5678.jpg', url: '#' },
            { id: '4', type: 'antt', filename: 'antt_veiculo.pdf', url: '#' },
            { id: '5', type: 'endereco', filename: 'comprovante_residencia.pdf', url: '#' },
            { id: '6', type: 'bancario', filename: 'dados_bancarios.pdf', url: '#' },
            { id: '7', type: 'pamcard', filename: 'pamcard_consulta.png', url: '#' },
            { id: '9', type: 'gr', filename: 'liberacao_gr.pdf', url: '#' },
            { id: '10', type: 'rcv', filename: 'certificado_rcv.pdf', url: '#' },
        ],
    },
    {
        id: 2,
        operador: 'Maria Operacional',
        dataEnvio: '14/01/2026',
        horaEnvio: '14:30',
        status: 'pendente',
        tempoEspera: '40 min',
        prioridade: 'alta',
        documentos: [
            { id: '11', type: 'cnh', filename: 'cnh_pedro.jpg', url: '#' },
            { id: '12', type: 'crlv', filename: 'crlv_LOG9E12.pdf', url: '#' },
            { id: '13', type: 'antt', filename: 'antt.pdf', url: '#' },
            { id: '14', type: 'endereco', filename: 'endereco.jpg', url: '#' },
            { id: '15', type: 'bancario', filename: 'banco.pdf', url: '#' },
            { id: '16', type: 'pamcard', filename: 'tag.png', url: '#' },
            { id: '18', type: 'gr', filename: 'gr.pdf', url: '#' },
            { id: '19', type: 'rcv', filename: 'rcv.pdf', url: '#' },
            { id: '20', type: 'outros', customDescription: 'Ficha do rastreador', filename: 'rastreador.pdf', url: '#' },
        ],
    },
    {
        id: 3,
        operador: 'Carlos Operacional',
        dataEnvio: '14/01/2026',
        horaEnvio: '13:15',
        status: 'em_analise',
        tempoEspera: '1h 50min',
        prioridade: 'normal',
        documentos: [
            { id: '21', type: 'cnh', filename: 'cnh_roberto.pdf', url: '#' },
            { id: '22', type: 'crlv', filename: 'crlv.pdf', url: '#' },
            { id: '23', type: 'antt', filename: 'antt.pdf', url: '#' },
            { id: '24', type: 'endereco', filename: 'endereco.pdf', url: '#' },
            { id: '25', type: 'bancario', filename: 'banco.pdf', url: '#' },
            { id: '26', type: 'pamcard', filename: 'pamcard.png', url: '#' },
            { id: '28', type: 'gr', filename: 'gr.pdf', url: '#' },
            { id: '29', type: 'rcv', filename: 'rcv.pdf', url: '#' },
        ],
    },
    {
        id: 4,
        operador: 'Ana Operacional',
        dataEnvio: '14/01/2026',
        horaEnvio: '10:00',
        status: 'aprovado',
        tempoEspera: '—',
        prioridade: 'normal',
        documentos: [
            { id: '30', type: 'cnh', filename: 'cnh.pdf', url: '#' },
            { id: '31', type: 'crlv', filename: 'crlv.pdf', url: '#' },
            { id: '32', type: 'antt', filename: 'antt.pdf', url: '#' },
            { id: '33', type: 'endereco', filename: 'endereco.pdf', url: '#' },
            { id: '34', type: 'bancario', filename: 'banco.pdf', url: '#' },
            { id: '35', type: 'pamcard', filename: 'pamcard.png', url: '#' },
            { id: '37', type: 'gr', filename: 'gr.pdf', url: '#' },
            { id: '38', type: 'rcv', filename: 'rcv.pdf', url: '#' },
        ],
    },
];

// Componente de cópia com feedback
function CopyButton({ text, label }: { text: string; label: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all group"
            title={`Copiar ${label}`}
        >
            {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
            ) : (
                <Copy className="w-4 h-4 text-slate-400 group-hover:text-white" />
            )}
            <span className="text-sm text-slate-300 group-hover:text-white truncate max-w-[200px]">{text}</span>
        </button>
    );
}

// Badge de Status
function StatusBadge({ status }: { status: Submission['status'] }) {
    const styles = {
        pendente: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        em_analise: 'bg-benfica-blue/20 text-benfica-blue border-benfica-blue/30',
        aprovado: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        rejeitado: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    const labels = {
        pendente: 'Pendente',
        em_analise: 'Em Análise',
        aprovado: 'Aprovado',
        rejeitado: 'Rejeitado',
    };

    return (
        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${styles[status]}`}>
            {labels[status]}
        </span>
    );
}

// Badge de Prioridade
function PriorityBadge({ priority }: { priority: Submission['prioridade'] }) {
    if (priority === 'normal') return null;
    const styles = {
        alta: 'bg-amber-500/20 text-amber-400',
        urgente: 'bg-red-500/20 text-red-400 animate-pulse',
    };
    return (
        <span className={`px-2 py-0.5 text-xs font-bold rounded ${styles[priority]}`}>
            {priority.toUpperCase()}
        </span>
    );
}

// Modal de Detalhes
function DetailModal({
    submission,
    onClose,
    onApprove,
    onReject,
    onStartAnalysis
}: {
    submission: Submission;
    onClose: () => void;
    onApprove: () => void;
    onReject: () => void;
    onStartAnalysis: () => void;
}) {
    const [downloadingAll, setDownloadingAll] = useState(false);

    // Agrupar documentos por tipo
    const groupedDocs = DOCUMENT_TYPES.map(type => ({
        ...type,
        files: submission.documentos.filter(d => d.type === type.id)
    })).filter(g => g.files.length > 0);

    const handleDownloadAll = async () => {
        setDownloadingAll(true);
        // Simular download
        await new Promise(r => setTimeout(r, 1500));
        setDownloadingAll(false);
        alert('Todos os documentos baixados! (simulação)');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-3xl bg-slate-950 rounded-2xl border border-white/20 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header Fixo */}
                <div className="bg-slate-900 p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-benfica-blue rounded-xl">
                            <FileSearch className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Cadastro #{submission.id}</h2>
                            <p className="text-sm text-slate-400">Enviado por {submission.operador}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <StatusBadge status={submission.status} />
                        <PriorityBadge priority={submission.prioridade} />
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Conteúdo Scrollável */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Info Rápida */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <User className="w-3 h-3" />
                                Operador
                            </div>
                            <CopyButton text={submission.operador} label="nome" />
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <Calendar className="w-3 h-3" />
                                Data/Hora
                            </div>
                            <p className="text-white font-medium">{submission.dataEnvio} às {submission.horaEnvio}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <Clock className="w-3 h-3" />
                                Tempo Espera
                            </div>
                            <p className="text-amber-400 font-bold">{submission.tempoEspera}</p>
                        </div>
                    </div>

                    {/* Botão Download Todos */}
                    <button
                        onClick={handleDownloadAll}
                        disabled={downloadingAll}
                        className="w-full py-3 bg-benfica-blue/20 hover:bg-benfica-blue/30 text-benfica-blue font-bold rounded-xl border border-benfica-blue/30 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <Download className={`w-5 h-5 ${downloadingAll ? 'animate-bounce' : ''}`} />
                        {downloadingAll ? 'Baixando...' : `Baixar Todos os Documentos (${submission.documentos.length})`}
                    </button>

                    {/* Documentos Agrupados por Tipo */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-benfica-blue" />
                            Documentos ({submission.documentos.length})
                        </h3>

                        {groupedDocs.map((group) => {
                            const colors = DOC_COLORS[group.color];
                            return (
                                <div key={group.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 ${colors.bg} rounded flex items-center justify-center`}>
                                                <FileCheck className="w-3 h-3 text-white" />
                                            </div>
                                            <span className={`text-sm font-bold ${colors.text}`}>
                                                {group.label}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                ({group.files.length} arquivo{group.files.length > 1 ? 's' : ''})
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {group.files.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2"
                                            >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    {file.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                        <ImageIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                    ) : (
                                                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                    )}
                                                    <span className="text-sm text-slate-300 truncate">
                                                        {file.customDescription || file.filename}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={() => window.open(file.url, '_blank')}
                                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                        title="Visualizar"
                                                    >
                                                        <ExternalLink className="w-4 h-4 text-slate-400 hover:text-white" />
                                                    </button>
                                                    <button
                                                        onClick={() => {/* download */ }}
                                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                        title="Baixar"
                                                    >
                                                        <Download className="w-4 h-4 text-slate-400 hover:text-benfica-blue" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer de Ações Fixo */}
                <div className="bg-slate-900 p-5 border-t border-white/10 flex gap-3 flex-shrink-0">
                    {submission.status === 'pendente' && (
                        <button
                            onClick={onStartAnalysis}
                            className="flex-1 py-3 bg-benfica-blue/20 text-benfica-blue font-bold rounded-xl border border-benfica-blue/30 hover:bg-benfica-blue/30 transition-colors"
                        >
                            Iniciar Análise
                        </button>
                    )}
                    <button
                        onClick={onReject}
                        className="flex-1 py-3 bg-red-500/10 text-red-400 font-bold rounded-xl border border-red-500/30 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                        <XCircle className="w-4 h-4" />
                        Rejeitar
                    </button>
                    <button
                        onClick={onApprove}
                        className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Aprovar
                    </button>
                </div>
            </div>
        </div>
    );
}

// Card de Submissão
function SubmissionCard({
    submission,
    onView,
    onApprove,
    onReject
}: {
    submission: Submission;
    onView: () => void;
    onApprove: () => void;
    onReject: () => void;
}) {
    return (
        <div
            className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
            onClick={onView}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-benfica-blue/20 rounded-lg">
                        <User className="w-4 h-4 text-benfica-blue" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm">{submission.operador}</p>
                        <p className="text-[11px] text-slate-500">{submission.dataEnvio} {submission.horaEnvio}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <PriorityBadge priority={submission.prioridade} />
                </div>
            </div>

            {/* Documentos Resumo */}
            <div className="flex flex-wrap gap-1 mb-3">
                {DOCUMENT_TYPES.slice(0, 6).map((type) => {
                    const hasDoc = submission.documentos.some(d => d.type === type.id);
                    const colors = DOC_COLORS[type.color];
                    return (
                        <div
                            key={type.id}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${hasDoc ? `${colors.bg} text-white` : 'bg-slate-700 text-slate-500'
                                }`}
                        >
                            {type.label}
                        </div>
                    );
                })}
                {submission.documentos.length > 6 && (
                    <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-600 text-white">
                        +{submission.documentos.length - 6}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{submission.tempoEspera}</span>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={onView}
                        className="p-1.5 bg-white/5 hover:bg-benfica-blue/20 rounded text-slate-400 hover:text-benfica-blue"
                        title="Visualizar"
                    >
                        <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onReject}
                        className="p-1.5 bg-white/5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
                        title="Rejeitar"
                    >
                        <XCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onApprove}
                        className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 rounded text-emerald-400"
                        title="Aprovar"
                    >
                        <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Coluna Kanban
function KanbanColumn({
    title,
    count,
    icon: Icon,
    color,
    submissions,
    onAction
}: {
    title: string;
    count: number;
    icon: React.ElementType;
    color: string;
    submissions: Submission[];
    onAction: (id: number, action: string) => void;
}) {
    const colorClasses: Record<string, string> = {
        amber: 'from-amber-500 to-orange-600',
        blue: 'from-benfica-blue to-blue-700',
        emerald: 'from-emerald-500 to-emerald-700',
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                    <div className={`p-2 bg-gradient-to-br ${colorClasses[color]} rounded-lg`}>
                        <Icon className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-sm font-bold text-white">{title}</h2>
                </div>
                <span className="px-2.5 py-1 bg-white/10 text-white text-xs font-bold rounded-full">
                    {count}
                </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
                {submissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-xl border border-dashed border-white/10 text-slate-500">
                        <Icon className="w-6 h-6 mb-2 opacity-50" />
                        <p className="text-xs">Nenhum cadastro</p>
                    </div>
                ) : (
                    submissions.map((sub) => (
                        <SubmissionCard
                            key={sub.id}
                            submission={sub}
                            onView={() => onAction(sub.id, 'view')}
                            onApprove={() => onAction(sub.id, 'approve')}
                            onReject={() => onAction(sub.id, 'reject')}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export function DashboardCadastroGR() {
    const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

    const handleAction = (id: number, action: string) => {
        if (action === 'view') {
            const sub = submissions.find(s => s.id === id);
            if (sub) setSelectedSubmission(sub);
            return;
        }

        setSubmissions(prev => prev.map(sub => {
            if (sub.id !== id) return sub;
            switch (action) {
                case 'approve':
                    return { ...sub, status: 'aprovado' as const, tempoEspera: '—' };
                case 'reject':
                    return { ...sub, status: 'rejeitado' as const, tempoEspera: '—' };
                case 'analyze':
                    return { ...sub, status: 'em_analise' as const };
                default:
                    return sub;
            }
        }));
        setSelectedSubmission(null);
    };

    const pendentes = submissions.filter(s => s.status === 'pendente');
    const emAnalise = submissions.filter(s => s.status === 'em_analise');
    const concluidos = submissions.filter(s => s.status === 'aprovado' || s.status === 'rejeitado');

    return (
        <Container>
            <div className="space-y-5 h-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-benfica-blue to-blue-700 rounded-xl">
                                <FileSearch className="h-5 w-5 text-white" />
                            </div>
                            Fila de Cadastros
                        </h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Visualize, baixe e aprove os documentos enviados
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {pendentes.filter(p => p.prioridade === 'urgente').length > 0 && (
                            <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-2 rounded-lg border border-red-500/30 animate-pulse">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="font-bold text-sm">
                                    {pendentes.filter(p => p.prioridade === 'urgente').length} Urgente
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 bg-amber-500/20 text-amber-400 px-3 py-2 rounded-lg border border-amber-500/30">
                            <Clock className="w-4 h-4" />
                            <span className="font-bold text-sm">{pendentes.length} Pendentes</span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500 rounded-lg">
                                <Clock className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{pendentes.length}</p>
                                <p className="text-[10px] text-slate-500">Aguardando</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-benfica-blue rounded-lg">
                                <FileSearch className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{emAnalise.length}</p>
                                <p className="text-[10px] text-slate-500">Em Análise</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">
                                    {submissions.filter(s => s.status === 'aprovado').length}
                                </p>
                                <p className="text-[10px] text-slate-500">Aprovados</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500 rounded-lg">
                                <XCircle className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">
                                    {submissions.filter(s => s.status === 'rejeitado').length}
                                </p>
                                <p className="text-[10px] text-slate-500">Rejeitados</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kanban */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <KanbanColumn
                        title="Pendentes"
                        count={pendentes.length}
                        icon={Clock}
                        color="amber"
                        submissions={pendentes}
                        onAction={handleAction}
                    />
                    <KanbanColumn
                        title="Em Análise"
                        count={emAnalise.length}
                        icon={FileSearch}
                        color="blue"
                        submissions={emAnalise}
                        onAction={handleAction}
                    />
                    <KanbanColumn
                        title="Concluídos"
                        count={concluidos.length}
                        icon={CheckCircle}
                        color="emerald"
                        submissions={concluidos}
                        onAction={handleAction}
                    />
                </div>
            </div>

            {/* Modal */}
            {selectedSubmission && (
                <DetailModal
                    submission={selectedSubmission}
                    onClose={() => setSelectedSubmission(null)}
                    onApprove={() => handleAction(selectedSubmission.id, 'approve')}
                    onReject={() => handleAction(selectedSubmission.id, 'reject')}
                    onStartAnalysis={() => handleAction(selectedSubmission.id, 'analyze')}
                />
            )}
        </Container>
    );
}
