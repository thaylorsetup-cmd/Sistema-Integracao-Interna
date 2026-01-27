import { useState, useEffect, useCallback } from 'react';
import { Container } from '@/components/layout';
import {
    FileSearch,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Eye,
    User,
    FileText,
    X,
    Calendar,
    Image as ImageIcon,
    Download,
    Copy,
    Check,
    ExternalLink,
    FileCheck,
    Loader2,
    RefreshCw,
    Wifi,
    WifiOff,
    AlertCircle
} from 'lucide-react';
import { filaApi, documentsApi, type Submission as ApiSubmission, type Document as ApiDocument } from '@/services/api';
import { useFilaSocket, type SubmissionNewEvent, type SubmissionUpdatedEvent } from '@/hooks/useSocket';

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
    url: string;
}

interface Delay {
    id: string;
    motivo: string;
    criado_em: string;
    criado_por_nome?: string;
}

interface Submission {
    id: string;
    operador: string;
    dataEnvio: string;
    horaEnvio: string;
    status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';
    documentos: DocumentFile[];
    tempoEspera: string;
    prioridade: 'normal' | 'alta' | 'urgente';
    delaysCount?: number;
    delays?: Delay[];
}

// Mapear status da API para status local
function mapApiStatus(status: string): Submission['status'] {
    const statusMap: Record<string, Submission['status']> = {
        'pendente': 'pendente',
        'em_analise': 'em_analise',
        'aprovado': 'aprovado',
        'rejeitado': 'rejeitado',
    };
    return statusMap[status] || 'pendente';
}

// Mapear prioridade da API para prioridade local
function mapApiPriority(priority: string): Submission['prioridade'] {
    const priorityMap: Record<string, Submission['prioridade']> = {
        'normal': 'normal',
        'alta': 'alta',
        'urgente': 'urgente',
    };
    return priorityMap[priority] || 'normal';
}

// Calcular tempo de espera
function calcularTempoEspera(createdAt: string): string {
    const criacao = new Date(createdAt);
    const agora = new Date();
    const diffMs = agora.getTime() - criacao.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin} min`;

    const diffHours = Math.floor(diffMin / 60);
    const remainingMin = diffMin % 60;

    if (diffHours < 24) {
        return remainingMin > 0 ? `${diffHours}h ${remainingMin}min` : `${diffHours}h`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
}

// Converter submission da API para o formato local
function mapApiSubmission(apiSubmission: ApiSubmission): Submission {
    const data = new Date(apiSubmission.data_envio || apiSubmission.created_at);

    return {
        id: apiSubmission.id,
        operador: (apiSubmission as any).operador_nome || apiSubmission.nome_motorista || 'Operador',
        dataEnvio: data.toLocaleDateString('pt-BR'),
        horaEnvio: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: mapApiStatus(apiSubmission.status),
        documentos: (apiSubmission.documents || []).map((doc: ApiDocument) => ({
            id: doc.id,
            type: doc.tipo,
            filename: doc.nome_original,
            url: `/api/documents/${doc.id}/download`,
        })),
        tempoEspera: ['aprovado', 'rejeitado'].includes(apiSubmission.status)
            ? '—'
            : calcularTempoEspera(apiSubmission.created_at),
        prioridade: mapApiPriority(apiSubmission.prioridade || 'normal'),
    };
}


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
    onDelay,
    onStartAnalysis
}: {
    submission: Submission;
    onClose: () => void;
    onApprove: () => void;
    onReject: () => void;
    onDelay: () => void;
    onStartAnalysis: () => void;
}) {
    const [downloadingAll, setDownloadingAll] = useState(false);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
    const [delays, setDelays] = useState<Delay[]>([]);
    const [loadingDelays, setLoadingDelays] = useState(false);

    // Carregar delays ao abrir modal
    useEffect(() => {
        const fetchDelays = async () => {
            setLoadingDelays(true);
            try {
                const response = await filaApi.buscarDelays(submission.id);
                if (response.success && response.data) {
                    setDelays(response.data as Delay[]);
                }
            } catch (err) {
                console.error('Erro ao buscar delays:', err);
            } finally {
                setLoadingDelays(false);
            }
        };
        fetchDelays();
    }, [submission.id]);

    // Agrupar documentos por tipo
    const groupedDocs = DOCUMENT_TYPES.map(type => ({
        ...type,
        files: submission.documentos.filter(d => d.type === type.id)
    })).filter(g => g.files.length > 0);

    const handleDownloadFile = async (doc: DocumentFile) => {
        try {
            setDownloadingFile(doc.id);
            const blob = await documentsApi.download(doc.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Erro ao baixar arquivo');
        } finally {
            setDownloadingFile(null);
        }
    };

    const handleDownloadAll = async () => {
        setDownloadingAll(true);
        try {
            for (const doc of submission.documentos) {
                await handleDownloadFile(doc);
                // Pequeno delay entre downloads
                await new Promise(r => setTimeout(r, 300));
            }
        } catch (error) {
            alert('Erro ao baixar alguns arquivos');
        } finally {
            setDownloadingAll(false);
        }
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
                                                        onClick={() => window.open(`/api/documents/${file.id}/download`, '_blank')}
                                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                        title="Visualizar"
                                                    >
                                                        <ExternalLink className="w-4 h-4 text-slate-400 hover:text-white" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadFile(file)}
                                                        disabled={downloadingFile === file.id}
                                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Baixar"
                                                    >
                                                        {downloadingFile === file.id ? (
                                                            <Loader2 className="w-4 h-4 text-benfica-blue animate-spin" />
                                                        ) : (
                                                            <Download className="w-4 h-4 text-slate-400 hover:text-benfica-blue" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Seção de Atrasos */}
                    {loadingDelays ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 text-benfica-blue animate-spin" />
                        </div>
                    ) : delays.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                            <h4 className="font-bold text-amber-400 mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Atrasos Registrados ({delays.length})
                            </h4>
                            <div className="space-y-2">
                                {delays.map((delay) => (
                                    <div key={delay.id} className="bg-slate-800/50 border-l-4 border-amber-500 pl-3 py-2 rounded-r-lg">
                                        <p className="text-sm text-white">{delay.motivo}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {new Date(delay.criado_em).toLocaleString('pt-BR')}
                                            {delay.criado_por_nome && ` • ${delay.criado_por_nome}`}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                        onClick={onDelay}
                        className="flex-1 py-3 bg-amber-500/10 text-amber-400 font-bold rounded-xl border border-amber-500/30 hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                        <AlertCircle className="w-4 h-4" />
                        Adicionar Atraso
                    </button>
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
            className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer relative"
            onClick={onView}
        >
            {/* Badge de Atraso */}
            {submission.delaysCount && submission.delaysCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse shadow-lg">
                    <Clock className="w-3 h-3" />
                    {submission.delaysCount}
                </div>
            )}

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
    onAction: (id: string, action: string) => void;
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
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Estados dos modais
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectSubmissionId, setRejectSubmissionId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectCategory, setRejectCategory] = useState('');

    const [showDelayModal, setShowDelayModal] = useState(false);
    const [delaySubmissionId, setDelaySubmissionId] = useState<string | null>(null);
    const [delayReason, setDelayReason] = useState('');

    // Carregar dados da API
    const loadSubmissions = useCallback(async (showRefreshing = false) => {
        try {
            if (showRefreshing) setIsRefreshing(true);
            else setIsLoading(true);

            const response = await filaApi.list();

            if (response.success && response.data) {
                const mappedSubmissions = response.data.map(mapApiSubmission);
                setSubmissions(mappedSubmissions);
                setError(null);
            } else {
                setError(response.error || 'Erro ao carregar dados');
            }
        } catch (err) {
            setError('Erro de conexão com o servidor');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Carregar dados ao montar
    useEffect(() => {
        loadSubmissions();
    }, [loadSubmissions]);

    // WebSocket para atualizações em tempo real
    const handleNewSubmission = useCallback((event: SubmissionNewEvent) => {
        const newSubmission = mapApiSubmission(event.submission);
        setSubmissions(prev => [newSubmission, ...prev]);
    }, []);

    const handleUpdatedSubmission = useCallback((event: SubmissionUpdatedEvent) => {
        setSubmissions(prev => prev.map(sub =>
            sub.id === event.submission.id
                ? mapApiSubmission(event.submission)
                : sub
        ));

        // Atualizar modal se estiver aberto
        if (selectedSubmission?.id === event.submission.id) {
            setSelectedSubmission(mapApiSubmission(event.submission));
        }
    }, [selectedSubmission]);

    const { isConnected } = useFilaSocket({
        onNew: handleNewSubmission,
        onUpdated: handleUpdatedSubmission,
    });

    // Funções para modais de rejeição e atraso
    const handleRejectClick = (submissionId: string) => {
        setRejectSubmissionId(submissionId);
        setShowRejectModal(true);
    };

    const handleRejectSubmit = async () => {
        if (!rejectSubmissionId || !rejectReason || !rejectCategory) {
            alert('Preencha todos os campos');
            return;
        }

        try {
            const response = await filaApi.rejeitar(rejectSubmissionId, rejectReason, rejectCategory);

            if (response.success) {
                setSubmissions(prev => prev.map(sub =>
                    sub.id === rejectSubmissionId ? mapApiSubmission(response.data!) : sub
                ));
                setShowRejectModal(false);
                setRejectReason('');
                setRejectCategory('');
                setRejectSubmissionId(null);
                setSelectedSubmission(null);
            } else {
                alert(response.error || 'Erro ao rejeitar cadastro');
            }
        } catch (err) {
            alert('Erro de conexão');
        }
    };

    const handleAddDelayClick = (submissionId: string) => {
        setDelaySubmissionId(submissionId);
        setShowDelayModal(true);
    };

    const handleAddDelaySubmit = async () => {
        if (!delaySubmissionId || !delayReason.trim()) {
            alert('Informe o motivo do atraso');
            return;
        }

        try {
            const response = await filaApi.adicionarAtraso(delaySubmissionId, delayReason);

            if (response.success) {
                // Recarregar dados para pegar delays atualizados
                await loadSubmissions(false);
                setShowDelayModal(false);
                setDelayReason('');
                setDelaySubmissionId(null);
                alert('Motivo de atraso adicionado. Operador será notificado.');
            } else {
                alert(response.error || 'Erro ao adicionar atraso');
            }
        } catch (err) {
            alert('Erro de conexão');
        }
    };

    // Ações
    const handleAction = async (id: string, action: string) => {
        if (action === 'view') {
            // Buscar detalhes completos (incluindo documentos) via API
            try {
                const response = await filaApi.get(id);
                if (response.success && response.data) {
                    setSelectedSubmission(mapApiSubmission(response.data));
                } else {
                    // Fallback: usar dados locais
                    const sub = submissions.find(s => s.id === id);
                    if (sub) setSelectedSubmission(sub);
                }
            } catch {
                // Fallback em caso de erro de rede
                const sub = submissions.find(s => s.id === id);
                if (sub) setSelectedSubmission(sub);
            }
            return;
        }

        if (action === 'reject') {
            handleRejectClick(id);
            return;
        }

        if (action === 'delay') {
            handleAddDelayClick(id);
            return;
        }

        try {
            let response;

            switch (action) {
                case 'approve':
                    response = await filaApi.aprovar(id);
                    break;
                case 'analyze':
                    response = await filaApi.analisar(id);
                    break;
                default:
                    return;
            }

            if (response.success && response.data) {
                // Atualizar localmente (o WebSocket também atualizará)
                setSubmissions(prev => prev.map(sub =>
                    sub.id === id ? mapApiSubmission(response.data!) : sub
                ));
                setSelectedSubmission(null);
            } else {
                alert(response.error || 'Erro ao executar ação');
            }
        } catch (err) {
            alert('Erro de conexão');
        }
    };

    const pendentes = submissions.filter(s => s.status === 'pendente');
    const emAnalise = submissions.filter(s => s.status === 'em_analise');
    const concluidos = submissions.filter(s => s.status === 'aprovado' || s.status === 'rejeitado');

    // Loading state
    if (isLoading) {
        return (
            <Container>
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                    <Loader2 className="w-10 h-10 text-benfica-blue animate-spin" />
                    <p className="text-slate-400">Carregando fila de cadastros...</p>
                </div>
            </Container>
        );
    }

    // Error state
    if (error) {
        return (
            <Container>
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                    <div className="p-4 bg-red-500/20 rounded-full">
                        <XCircle className="w-10 h-10 text-red-400" />
                    </div>
                    <p className="text-red-400 font-bold">{error}</p>
                    <button
                        onClick={() => loadSubmissions()}
                        className="px-4 py-2 bg-benfica-blue text-white rounded-lg hover:bg-benfica-blue/80 transition-colors"
                    >
                        Tentar novamente
                    </button>
                </div>
            </Container>
        );
    }

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
                        <button
                            onClick={() => loadSubmissions(true)}
                            disabled={isRefreshing}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors disabled:opacity-50"
                            title="Atualizar"
                        >
                            <RefreshCw className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
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

            {/* Modal de Rejeição */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
                    <div className="relative w-full max-w-md bg-slate-950 rounded-2xl border border-white/20 p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-white">Rejeitar Cadastro</h3>
                            <button onClick={() => setShowRejectModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Categoria da Rejeição
                            </label>
                            <select
                                value={rejectCategory}
                                onChange={(e) => setRejectCategory(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                            >
                                <option value="" className="bg-slate-900">Selecione...</option>
                                <option value="documentos-incompletos" className="bg-slate-900">Documentos Incompletos</option>
                                <option value="documentos-invalidos" className="bg-slate-900">Documentos Inválidos</option>
                                <option value="informacoes-incorretas" className="bg-slate-900">Informações Incorretas</option>
                                <option value="nao-atende-requisitos" className="bg-slate-900">Não Atende Requisitos</option>
                                <option value="outro" className="bg-slate-900">Outro</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Motivo Detalhado
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                                placeholder="Descreva o motivo da rejeição..."
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 py-3 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                disabled={!rejectReason || !rejectCategory}
                                className={`flex-1 py-3 rounded-xl font-bold transition-colors ${rejectReason && rejectCategory
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                Confirmar Rejeição
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Atraso */}
            {showDelayModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDelayModal(false)} />
                    <div className="relative w-full max-w-md bg-slate-950 rounded-2xl border border-white/20 p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                Adicionar Motivo de Atraso
                            </h3>
                            <button onClick={() => setShowDelayModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <p className="text-sm text-slate-400">
                            O operador será notificado diretamente sobre o motivo do atraso.
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Motivo do Atraso
                            </label>
                            <textarea
                                value={delayReason}
                                onChange={(e) => setDelayReason(e.target.value)}
                                rows={4}
                                placeholder="Ex: Aguardando documento ANTT atualizado..."
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setShowDelayModal(false)}
                                className="flex-1 py-3 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddDelaySubmit}
                                disabled={!delayReason.trim()}
                                className={`flex-1 py-3 rounded-xl font-bold transition-colors ${delayReason.trim()
                                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                Adicionar Atraso
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {selectedSubmission && (
                <DetailModal
                    submission={selectedSubmission}
                    onClose={() => setSelectedSubmission(null)}
                    onApprove={() => handleAction(selectedSubmission.id, 'approve')}
                    onReject={() => handleAction(selectedSubmission.id, 'reject')}
                    onDelay={() => handleAction(selectedSubmission.id, 'delay')}
                    onStartAnalysis={() => handleAction(selectedSubmission.id, 'analyze')}
                />
            )}
        </Container>
    );
}
