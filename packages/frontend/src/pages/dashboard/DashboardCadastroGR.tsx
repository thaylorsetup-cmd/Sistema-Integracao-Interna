import { useState } from 'react';
import { Container } from '@/components/layout';
import { DataComparisonCard } from '@/components/ui/DataComparisonCard';
import { searchDriverByCPF } from '@/services/sswService';
import type { DriverData } from '@/types/ssw.types';
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
    Loader2,
    Shield
} from 'lucide-react';

interface Submission {
    id: number;
    solicitante: string;
    motorista: string;
    cpfMotorista: string;
    telefone: string;
    placaCavalo: string;
    placaCarreta: string;
    origem: string;
    destino: string;
    tipoMercadoria: string;
    valorMercadoria: string;
    status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado' | 'correcao';
    tempoEspera: string;
    documentos: string[];
    prioridade: 'normal' | 'alta' | 'urgente';
    dataEnvio: string;
}

// Mock data with more realistic info
const INITIAL_SUBMISSIONS: Submission[] = [
    {
        id: 1,
        solicitante: 'Maria Operacional',
        motorista: 'João da Silva',
        cpfMotorista: '123.456.789-00',
        telefone: '(62) 99999-1234',
        placaCavalo: 'GOI-2B34',
        placaCarreta: 'TRK-5678',
        origem: 'Goiânia - GO',
        destino: 'São Paulo - SP',
        tipoMercadoria: 'Eletrônicos',
        valorMercadoria: 'R$ 150.000,00',
        status: 'pendente',
        tempoEspera: '15 min',
        documentos: ['CNH', 'CRLV Cavalo', 'CRLV Carreta', 'ANTT', 'Foto Motorista', 'Comprovante Endereço', 'CTE', 'NF-e'],
        prioridade: 'urgente',
        dataEnvio: '26/12/2024 03:45',
    },
    {
        id: 2,
        solicitante: 'Carlos Operacional',
        motorista: 'Pedro Santos',
        cpfMotorista: '987.654.321-00',
        telefone: '(62) 98888-5678',
        placaCavalo: 'LOG-9E12',
        placaCarreta: 'CAR-1234',
        origem: 'Brasília - DF',
        destino: 'Belo Horizonte - MG',
        tipoMercadoria: 'Medicamentos',
        valorMercadoria: 'R$ 80.000,00',
        status: 'pendente',
        tempoEspera: '45 min',
        documentos: ['CNH', 'CRLV Cavalo', 'CRLV Carreta', 'ANTT', 'Foto Motorista', 'NF-e'],
        prioridade: 'alta',
        dataEnvio: '26/12/2024 03:15',
    },
    {
        id: 3,
        solicitante: 'Ana Operacional',
        motorista: 'Roberto Lima',
        cpfMotorista: '456.789.123-00',
        telefone: '(62) 97777-9012',
        placaCavalo: 'FRT-7F89',
        placaCarreta: 'REB-9012',
        origem: 'Cuiabá - MT',
        destino: 'Goiânia - GO',
        tipoMercadoria: 'Grãos',
        valorMercadoria: 'R$ 45.000,00',
        status: 'em_analise',
        tempoEspera: '1h 20min',
        documentos: ['CNH', 'CRLV Cavalo', 'CRLV Carreta', 'ANTT', 'Foto Motorista', 'CTE', 'NF-e'],
        prioridade: 'normal',
        dataEnvio: '26/12/2024 02:40',
    },
    {
        id: 4,
        solicitante: 'José Operacional',
        motorista: 'Fernando Costa',
        cpfMotorista: '321.654.987-00',
        telefone: '(62) 96666-3456',
        placaCavalo: 'TRN-3A56',
        placaCarreta: 'SEM-4567',
        origem: 'Goiânia - GO',
        destino: 'Recife - PE',
        tipoMercadoria: 'Têxteis',
        valorMercadoria: 'R$ 120.000,00',
        status: 'aprovado',
        tempoEspera: '—',
        documentos: ['CNH', 'CRLV Cavalo', 'CRLV Carreta', 'ANTT', 'Foto Motorista', 'Comprovante Endereço', 'CTE', 'NF-e', 'Contrato'],
        prioridade: 'normal',
        dataEnvio: '26/12/2024 01:30',
    },
];

// Status Badge Component
function StatusBadge({ status }: { status: Submission['status'] }) {
    const styles = {
        pendente: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        em_analise: 'bg-benfica-blue/20 text-benfica-blue border-benfica-blue/30',
        aprovado: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        rejeitado: 'bg-red-500/20 text-red-400 border-red-500/30',
        correcao: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };

    const labels = {
        pendente: 'Pendente',
        em_analise: 'Em Análise',
        aprovado: 'Aprovado',
        rejeitado: 'Rejeitado',
        correcao: 'Correção Solicitada',
    };

    return (
        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${styles[status]}`}>
            {labels[status]}
        </span>
    );
}

// Priority Badge Component
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

// Detail Modal Component
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
    const [sswData, setSSWData] = useState<DriverData | null>(null);
    const [isLoadingSSW, setIsLoadingSSW] = useState(false);
    const [sswError, setSSWError] = useState<string | null>(null);

    // Handler para consultar SSW
    const handleConsultSSW = async () => {
        setIsLoadingSSW(true);
        setSSWError(null);
        try {
            const data = await searchDriverByCPF(submission.cpfMotorista);
            if (data) {
                setSSWData(data);
            } else {
                setSSWError('Motorista não encontrado no SSW');
            }
        } catch (error) {
            setSSWError(error instanceof Error ? error.message : 'Erro ao consultar SSW');
        } finally {
            setIsLoadingSSW(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-slate-950/95 backdrop-blur-xl p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-benfica-blue/20 rounded-xl">
                            <User className="w-6 h-6 text-benfica-blue" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{submission.motorista}</h2>
                            <p className="text-sm text-slate-400">{submission.placaCavalo} / {submission.placaCarreta}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <StatusBadge status={submission.status} />
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                    <User className="w-3 h-3" />
                                    <span>CPF Motorista</span>
                                </div>
                                <button
                                    onClick={handleConsultSSW}
                                    disabled={isLoadingSSW}
                                    className="px-2 py-1 text-xs font-medium bg-benfica-blue/20 text-benfica-blue rounded-lg hover:bg-benfica-blue/30 transition-colors flex items-center gap-1 disabled:opacity-50"
                                >
                                    {isLoadingSSW ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Buscando...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-3 h-3" />
                                            Consultar SSW
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="text-white font-medium">{submission.cpfMotorista}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <Phone className="w-3 h-3" />
                                <span>Telefone</span>
                            </div>
                            <p className="text-white font-medium">{submission.telefone}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <MapPin className="w-3 h-3" />
                                <span>Origem</span>
                            </div>
                            <p className="text-white font-medium">{submission.origem}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <MapPin className="w-3 h-3" />
                                <span>Destino</span>
                            </div>
                            <p className="text-white font-medium">{submission.destino}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <Package className="w-3 h-3" />
                                <span>Mercadoria</span>
                            </div>
                            <p className="text-white font-medium">{submission.tipoMercadoria}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <DollarSign className="w-3 h-3" />
                                <span>Valor</span>
                            </div>
                            <p className="text-emerald-400 font-bold">{submission.valorMercadoria}</p>
                        </div>
                    </div>

                    {/* SSW Data Section */}
                    {(sswData || sswError) && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Verificação SSW
                            </h3>
                            {sswError && (
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
                                    <AlertTriangle className="w-5 h-5" />
                                    <div>
                                        <p className="font-medium">Erro na consulta</p>
                                        <p className="text-sm opacity-80">{sswError}</p>
                                    </div>
                                </div>
                            )}
                            {sswData && (
                                <DataComparisonCard
                                    submitted={submission}
                                    sswData={sswData}
                                />
                            )}
                        </div>
                    )}

                    {/* Documents */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Documentos Enviados ({submission.documentos.length})
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {submission.documentos.map((doc, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white/5 hover:bg-white/10 rounded-xl p-3 border border-white/10 cursor-pointer transition-all group"
                                >
                                    <div className="aspect-square bg-slate-800/50 rounded-lg mb-2 flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-slate-500 group-hover:text-benfica-blue transition-colors" />
                                    </div>
                                    <p className="text-xs text-center text-slate-300 font-medium truncate">{doc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>Enviado em {submission.dataEnvio}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <span>Por {submission.solicitante}</span>
                        </div>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-xl p-6 border-t border-white/10 flex gap-3">
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
                        Aprovar Cadastro
                    </button>
                </div>
            </div>
        </div>
    );
}

// Submission Card Component
function SubmissionCard({
    submission,
    onView,
    onApprove,
    onReject,
    onRequestCorrection
}: {
    submission: Submission;
    onView: () => void;
    onApprove: () => void;
    onReject: () => void;
    onRequestCorrection: () => void;
}) {
    return (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-benfica-blue/20 rounded-xl">
                        <User className="w-5 h-5 text-benfica-blue" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold">{submission.motorista}</h3>
                        <p className="text-sm text-slate-400">{submission.solicitante}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <PriorityBadge priority={submission.prioridade} />
                    <StatusBadge status={submission.status} />
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{submission.placaCavalo} / {submission.placaCarreta}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{submission.documentos.length} documentos</span>
                </div>
                <div className="flex items-center gap-2 text-sm col-span-2">
                    <ChevronRight className="w-4 h-4 text-benfica-blue" />
                    <span className="text-slate-300">{submission.origem} → {submission.destino}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Aguardando há {submission.tempoEspera}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onView}
                        className="p-2 bg-white/5 hover:bg-benfica-blue/20 rounded-lg text-slate-400 hover:text-benfica-blue transition-all"
                        title="Visualizar"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onRequestCorrection}
                        className="p-2 bg-white/5 hover:bg-purple-500/20 rounded-lg text-slate-400 hover:text-purple-400 transition-all"
                        title="Solicitar Correção"
                    >
                        <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onReject}
                        className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-all"
                        title="Rejeitar"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onApprove}
                        className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-400 hover:text-emerald-300 transition-all"
                        title="Aprovar"
                    >
                        <CheckCircle className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Kanban Column Component
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
    const colorClasses = {
        amber: 'from-amber-500 to-orange-600 shadow-amber-500/30',
        blue: 'from-benfica-blue to-blue-700 shadow-benfica-blue/30',
        emerald: 'from-emerald-500 to-emerald-700 shadow-emerald-500/30',
    };

    return (
        <div className="flex flex-col">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                    <div className={`p-2 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-xl shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                </div>
                <span className="px-3 py-1 bg-white/10 text-white text-sm font-bold rounded-full">
                    {count}
                </span>
            </div>

            {/* Cards */}
            <div className="space-y-4 flex-1">
                {submissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-2xl border border-dashed border-white/10 text-slate-500">
                        <Icon className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">Nenhum item</p>
                    </div>
                ) : (
                    submissions.map((sub) => (
                        <SubmissionCard
                            key={sub.id}
                            submission={sub}
                            onView={() => onAction(sub.id, 'view')}
                            onApprove={() => onAction(sub.id, 'approve')}
                            onReject={() => onAction(sub.id, 'reject')}
                            onRequestCorrection={() => onAction(sub.id, 'correction')}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export function DashboardCadastroGR() {
    const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
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
                case 'correction':
                    return { ...sub, status: 'correcao' as const };
                case 'analyze':
                    return { ...sub, status: 'em_analise' as const };
                default:
                    return sub;
            }
        }));

        setSelectedSubmission(null);
    };

    const pendentes = submissions.filter(s => s.status === 'pendente');
    const emAnalise = submissions.filter(s => s.status === 'em_analise' || s.status === 'correcao');
    const concluidos = submissions.filter(s => s.status === 'aprovado' || s.status === 'rejeitado');

    return (
        <Container>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-3">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-benfica-blue/30 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity" />
                                <div className="relative p-2.5 bg-gradient-to-br from-benfica-blue to-blue-700 rounded-xl shadow-lg shadow-benfica-blue/30 border border-white/20">
                                    <FileSearch className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            Verificação de Cadastros
                        </h1>
                        <p className="mt-2 text-slate-400 font-medium">
                            Analise e aprove os documentos enviados pelo operacional
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-xl text-amber-400 px-4 py-2.5 rounded-xl border border-amber-500/30">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-bold text-sm">{pendentes.length} Pendentes</span>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{pendentes.length}</p>
                                <p className="text-xs text-slate-400">Aguardando</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-benfica-blue to-blue-700 rounded-xl">
                                <FileSearch className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{emAnalise.length}</p>
                                <p className="text-xs text-slate-400">Em Análise</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl">
                                <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{submissions.filter(s => s.status === 'aprovado').length}</p>
                                <p className="text-xs text-slate-400">Aprovados Hoje</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-red-500 to-rose-700 rounded-xl">
                                <XCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{submissions.filter(s => s.status === 'rejeitado').length}</p>
                                <p className="text-xs text-slate-400">Rejeitados</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        title="Concluídos Hoje"
                        count={concluidos.length}
                        icon={CheckCircle}
                        color="emerald"
                        submissions={concluidos}
                        onAction={handleAction}
                    />
                </div>
            </div>

            {/* Detail Modal */}
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
