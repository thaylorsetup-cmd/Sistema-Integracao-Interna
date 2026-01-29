/**
 * NovoCadastro - Página para criar novo cadastro
 * Processo em 4 etapas:
 * 1. Selecionar tipo de cadastro
 * 2. Preencher formulário com campos dinâmicos
 * 3. Upload de documentos
 * 4. Revisão e envio
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout';
import { TipoCadastroSelector } from '@/components/cadastro';
import {
    ChevronLeft,
    ChevronRight,
    Send,
    CheckCircle,
    AlertTriangle,
    Loader2,
    FileText,
    User,
    Truck,
    MapPin,
    Phone,
    Mail,
    CreditCard,
    FileCheck,
    X,
    Upload,
    Image,
    RefreshCw,
    Info
} from 'lucide-react';
import { cn } from '@/utils/classnames';
import {
    TIPOS_CADASTRO,
    DOCUMENT_LABELS,
    FIELD_LABELS,
    TIPO_MERCADORIA_OPTIONS,
    TIPO_VEICULO_OPTIONS,
    verificarRastreamento,
    validarCamposObrigatorios,
    validarDocumentosObrigatorios,
    type TipoCadastro,
    type DocumentType
} from '@/config/tipoCadastro';
import { filaApi, documentsApi, type CreateSubmissionData } from '@/services/api';
import { useFileUpload, formatFileSize } from '@/hooks/useFileUpload';

// =====================================================
// TIPOS LOCAIS
// =====================================================

interface FormData {
    // Dados do motorista
    nomeMotorista: string;
    cpf: string;
    telefone: string;
    email: string;
    telMotorista: string;

    // Dados do veículo
    placa: string;
    tipoVeiculo: string;

    // Dados da operação
    origem: string;
    destino: string;
    localizacaoAtual: string;
    tipoMercadoria: string;
    valorMercadoria: string;

    // Dados adicionais (Cadastro Novo)
    telProprietario: string;
    enderecoResidencial: string;
    numeroPis: string;
    referenciaComercial1: string;
    referenciaComercial2: string;
    referenciaPessoal1: string;
    referenciaPessoal2: string;
    referenciaPessoal3: string;

    // Observações
    observacoes: string;
    prioridade: 'normal' | 'alta' | 'urgente';
}

const INITIAL_FORM_DATA: FormData = {
    nomeMotorista: '',
    cpf: '',
    telefone: '',
    email: '',
    telMotorista: '',
    placa: '',
    tipoVeiculo: '',
    origem: '',
    destino: '',
    localizacaoAtual: '',
    tipoMercadoria: '',
    valorMercadoria: '',
    telProprietario: '',
    enderecoResidencial: '',
    numeroPis: '',
    referenciaComercial1: '',
    referenciaComercial2: '',
    referenciaPessoal1: '',
    referenciaPessoal2: '',
    referenciaPessoal3: '',
    observacoes: '',
    prioridade: 'normal',
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function NovoCadastro() {
    const navigate = useNavigate();

    // Estado
    const [step, setStep] = useState(1);
    const [tipoCadastro, setTipoCadastro] = useState<TipoCadastro | undefined>();
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [createdSubmissionId, setCreatedSubmissionId] = useState<string | null>(null);
    const [selectedDocTipo, setSelectedDocTipo] = useState<DocumentType>('outros');

    // Upload de arquivos
    const {
        files,
        isUploading,
        overallProgress,
        addFiles,
        removeFile,
        updateFileType,
        uploadAll,
        clearFiles,
        retryFile,
    } = useFileUpload({
        onError: (error) => setSubmitError(error),
    });

    // Configuração do tipo selecionado
    const tipoConfig = useMemo(() => {
        return tipoCadastro ? TIPOS_CADASTRO[tipoCadastro] : null;
    }, [tipoCadastro]);

    // Verificar se requer rastreamento
    const requerRastreamento = useMemo(() => {
        if (!tipoCadastro || !formData.valorMercadoria) return false;
        const valor = parseFloat(formData.valorMercadoria.replace(/\D/g, '')) / 100;
        return verificarRastreamento(tipoCadastro, valor);
    }, [tipoCadastro, formData.valorMercadoria]);

    // Validação de campos
    const camposValidos = useMemo(() => {
        if (!tipoConfig) return { valido: false, camposFaltantes: [] };
        return validarCamposObrigatorios(tipoConfig, formData);
    }, [tipoConfig, formData]);

    // Validação de documentos
    const documentosValidos = useMemo(() => {
        if (!tipoConfig) return { valido: false, documentosFaltantes: [] };
        const tiposEnviados = files
            .filter(f => f.status !== 'error')
            .map(f => f.tipo);
        return validarDocumentosObrigatorios(tipoConfig, tiposEnviados);
    }, [tipoConfig, files]);

    // Handlers
    const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleNextStep = () => {
        if (step < 4) setStep(step + 1);
    };

    const handlePrevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        if (!tipoCadastro || !tipoConfig) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // 1. Criar submission
            const createData: CreateSubmissionData & { tipoCadastro: TipoCadastro } = {
                nomeMotorista: formData.nomeMotorista,
                cpf: formData.cpf,
                telefone: formData.telefone,
                email: formData.email || undefined,
                placa: formData.placa || undefined,
                tipoVeiculo: formData.tipoVeiculo || undefined,
                prioridade: formData.prioridade,
                observacoes: formData.observacoes || undefined,
                origem: formData.origem || undefined,
                destino: formData.destino || undefined,
                localizacaoAtual: formData.localizacaoAtual || undefined,
                tipoMercadoria: formData.tipoMercadoria || undefined,
                tipoCadastro,
            };

            // Adicionar campos extras para cadastro novo
            if (tipoCadastro === 'novo_cadastro') {
                Object.assign(createData, {
                    telProprietario: formData.telProprietario || undefined,
                    enderecoResidencial: formData.enderecoResidencial || undefined,
                    numeroPis: formData.numeroPis || undefined,
                    valorMercadoria: formData.valorMercadoria
                        ? parseFloat(formData.valorMercadoria.replace(/\D/g, '')) / 100
                        : undefined,
                    telMotorista: formData.telMotorista || undefined,
                    referenciaComercial1: formData.referenciaComercial1 || undefined,
                    referenciaComercial2: formData.referenciaComercial2 || undefined,
                    referenciaPessoal1: formData.referenciaPessoal1 || undefined,
                    referenciaPessoal2: formData.referenciaPessoal2 || undefined,
                    referenciaPessoal3: formData.referenciaPessoal3 || undefined,
                    requerRastreamento,
                });
            }

            const response = await filaApi.create(createData as CreateSubmissionData);

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Erro ao criar cadastro');
            }

            const submissionId = response.data.id;
            setCreatedSubmissionId(submissionId);

            // 2. Upload de documentos
            if (files.length > 0) {
                await uploadAll(submissionId);
            }

            setSubmitSuccess(true);
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Erro desconhecido');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Renderizar steps
    const renderStepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                    <div
                        className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all',
                            s === step
                                ? 'bg-benfica-blue text-white scale-110'
                                : s < step
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white/10 text-slate-400'
                        )}
                    >
                        {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                    </div>
                    {s < 4 && (
                        <div
                            className={cn(
                                'w-12 h-1 mx-1 rounded-full transition-all',
                                s < step ? 'bg-emerald-500' : 'bg-white/10'
                            )}
                        />
                    )}
                </div>
            ))}
        </div>
    );

    // Step 1: Selecionar Tipo
    const renderStep1 = () => (
        <div className="space-y-6">
            <TipoCadastroSelector
                value={tipoCadastro}
                onChange={setTipoCadastro}
            />
        </div>
    );

    // Step 2: Formulário
    const renderStep2 = () => {
        if (!tipoConfig) return null;

        const allFields = [...tipoConfig.camposObrigatorios, ...tipoConfig.camposOpcionais];

        const renderField = (field: string) => {
            const isRequired = tipoConfig.camposObrigatorios.includes(field);
            const label = FIELD_LABELS[field] || field;
            const fieldKey = field as keyof FormData;

            // Campos de seleção
            if (field === 'tipoVeiculo') {
                return (
                    <div key={field}>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {label} {isRequired && <span className="text-red-400">*</span>}
                        </label>
                        <select
                            value={formData[fieldKey] || ''}
                            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                        >
                            <option value="">Selecione...</option>
                            {TIPO_VEICULO_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                );
            }

            if (field === 'tipoMercadoria') {
                return (
                    <div key={field}>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {label} {isRequired && <span className="text-red-400">*</span>}
                        </label>
                        <select
                            value={formData[fieldKey] || ''}
                            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                        >
                            <option value="">Selecione...</option>
                            {TIPO_MERCADORIA_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                );
            }

            if (field === 'prioridade') {
                return (
                    <div key={field}>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {label}
                        </label>
                        <select
                            value={formData.prioridade}
                            onChange={(e) => handleFieldChange('prioridade', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                        >
                            <option value="normal">Normal</option>
                            <option value="alta">Alta</option>
                            <option value="urgente">Urgente</option>
                        </select>
                    </div>
                );
            }

            // Campo de texto longo
            if (field === 'observacoes' || field === 'enderecoResidencial') {
                return (
                    <div key={field} className="col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {label} {isRequired && <span className="text-red-400">*</span>}
                        </label>
                        <textarea
                            value={formData[fieldKey] || ''}
                            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-benfica-blue focus:outline-none resize-none"
                            placeholder={`Digite ${label.toLowerCase()}...`}
                        />
                    </div>
                );
            }

            // Campo de valor monetário
            if (field === 'valorMercadoria') {
                return (
                    <div key={field}>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {label} {isRequired && <span className="text-red-400">*</span>}
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                            <input
                                type="text"
                                value={formData[fieldKey] || ''}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    const formatted = (parseInt(value || '0') / 100).toLocaleString('pt-BR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    });
                                    handleFieldChange(fieldKey, formatted);
                                }}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                                placeholder="0,00"
                            />
                        </div>
                        {requerRastreamento && (
                            <p className="text-amber-400 text-xs mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Requer rastreamento (valor acima de R$ 500.000)
                            </p>
                        )}
                    </div>
                );
            }

            // Campo de texto padrão
            return (
                <div key={field}>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        {label} {isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input
                        type={field.includes('email') ? 'email' : field.includes('tel') || field.includes('telefone') ? 'tel' : 'text'}
                        value={formData[fieldKey] || ''}
                        onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                        placeholder={`Digite ${label.toLowerCase()}...`}
                    />
                </div>
            );
        };

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-benfica-blue/20 rounded-lg">
                        <FileText className="w-5 h-5 text-benfica-blue" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Dados do Cadastro</h3>
                        <p className="text-sm text-slate-400">
                            Preencha os campos obrigatórios (*) e opcionais
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allFields.map(renderField)}
                </div>

                {!camposValidos.valido && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-amber-400 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Campos obrigatórios faltando:</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {camposValidos.camposFaltantes.map(campo => (
                                <span key={campo} className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded">
                                    {FIELD_LABELS[campo] || campo}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Step 3: Upload de Documentos
    const renderStep3 = () => {
        if (!tipoConfig) return null;

        const handleDrop = (e: React.DragEvent) => {
            e.preventDefault();
            if (e.dataTransfer.files.length > 0) {
                addFiles(e.dataTransfer.files, selectedDocTipo);
            }
        };

        const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                addFiles(e.target.files, selectedDocTipo);
            }
        };

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-benfica-blue/20 rounded-lg">
                        <Upload className="w-5 h-5 text-benfica-blue" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Upload de Documentos</h3>
                        <p className="text-sm text-slate-400">
                            Envie os documentos obrigatórios para o tipo de cadastro selecionado
                        </p>
                    </div>
                </div>

                {/* Documentos Obrigatórios */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-400" />
                        Documentos Obrigatórios
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {tipoConfig.documentosObrigatorios.map((doc) => {
                            const hasDoc = files.some(f => f.tipo === doc && f.status !== 'error');
                            return (
                                <span
                                    key={doc}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                                        hasDoc
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-white/10 text-slate-400 border border-white/10'
                                    )}
                                >
                                    {hasDoc && <CheckCircle className="w-3 h-3 inline mr-1" />}
                                    {DOCUMENT_LABELS[doc] || doc.toUpperCase()}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Seletor de Tipo */}
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-slate-300">Tipo do documento:</label>
                    <select
                        value={selectedDocTipo}
                        onChange={(e) => setSelectedDocTipo(e.target.value as DocumentType)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                    >
                        {Object.entries(DOCUMENT_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>

                {/* Zona de Drop */}
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-benfica-blue/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('file-input')?.click()}
                >
                    <input
                        id="file-input"
                        type="file"
                        multiple
                        accept="image/*,application/pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-white font-medium mb-2">
                        Arraste arquivos aqui ou clique para selecionar
                    </p>
                    <p className="text-sm text-slate-400">
                        PDF, imagens (JPG, PNG) ou documentos Word. Máx 50MB por arquivo
                    </p>
                </div>

                {/* Lista de Arquivos */}
                {files.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-white">
                            Arquivos selecionados ({files.length})
                        </h4>
                        <div className="space-y-2">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className={cn(
                                        'flex items-center gap-3 p-3 rounded-lg border',
                                        file.status === 'error' && 'border-red-500/30 bg-red-500/10',
                                        file.status === 'success' && 'border-emerald-500/30 bg-emerald-500/10',
                                        file.status === 'uploading' && 'border-blue-500/30 bg-blue-500/10',
                                        file.status === 'pending' && 'border-white/10 bg-white/5'
                                    )}
                                >
                                    {/* Preview */}
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                                        {file.preview ? (
                                            <img src={file.preview} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <FileText className="w-6 h-6 text-slate-400" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{file.file.name}</p>
                                        <p className="text-xs text-slate-400">
                                            {formatFileSize(file.file.size)} • {DOCUMENT_LABELS[file.tipo] || file.tipo}
                                        </p>
                                        {file.status === 'uploading' && (
                                            <div className="w-full h-1 bg-white/10 rounded-full mt-1">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all"
                                                    style={{ width: `${file.progress}%` }}
                                                />
                                            </div>
                                        )}
                                        {file.error && (
                                            <p className="text-xs text-red-400 mt-1">{file.error}</p>
                                        )}
                                    </div>

                                    {/* Seletor de Tipo (se pendente) */}
                                    {file.status === 'pending' && (
                                        <select
                                            value={file.tipo}
                                            onChange={(e) => updateFileType(file.id, e.target.value as DocumentType)}
                                            className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white"
                                        >
                                            {Object.entries(DOCUMENT_LABELS).map(([value, label]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </select>
                                    )}

                                    {/* Status */}
                                    {file.status === 'uploading' && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
                                    {file.status === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                                    {file.status === 'error' && (
                                        <button onClick={() => retryFile(file.id)} className="p-1 hover:bg-white/10 rounded">
                                            <RefreshCw className="w-4 h-4 text-red-400" />
                                        </button>
                                    )}

                                    {/* Remover */}
                                    {(file.status === 'pending' || file.status === 'error') && (
                                        <button
                                            onClick={() => removeFile(file.id)}
                                            className="p-1 hover:bg-white/10 rounded"
                                        >
                                            <X className="w-4 h-4 text-slate-400" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Validação */}
                {!documentosValidos.valido && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-amber-400 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Documentos obrigatórios faltando:</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {documentosValidos.documentosFaltantes.map(doc => (
                                <span key={doc} className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded">
                                    {DOCUMENT_LABELS[doc] || doc.toUpperCase()}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Step 4: Revisão
    const renderStep4 = () => {
        if (!tipoConfig || !tipoCadastro) return null;

        if (submitSuccess) {
            return (
                <div className="text-center py-12">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Cadastro Enviado!</h2>
                    <p className="text-slate-400 mb-6">
                        Seu cadastro foi enviado com sucesso e está na fila para análise.
                    </p>
                    {createdSubmissionId && (
                        <p className="text-sm text-slate-500 mb-6">
                            ID: {createdSubmissionId}
                        </p>
                    )}
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                        >
                            Voltar ao Dashboard
                        </button>
                        <button
                            onClick={() => {
                                setStep(1);
                                setTipoCadastro(undefined);
                                setFormData(INITIAL_FORM_DATA);
                                clearFiles();
                                setSubmitSuccess(false);
                                setCreatedSubmissionId(null);
                            }}
                            className="px-6 py-3 bg-benfica-blue text-white rounded-lg hover:bg-benfica-blue/80 transition-colors"
                        >
                            Novo Cadastro
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-benfica-blue/20 rounded-lg">
                        <FileCheck className="w-5 h-5 text-benfica-blue" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Revisão Final</h3>
                        <p className="text-sm text-slate-400">
                            Confira os dados antes de enviar
                        </p>
                    </div>
                </div>

                {/* Resumo do Tipo */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-sm font-semibold text-slate-400 mb-2">Tipo de Cadastro</h4>
                    <p className="text-lg font-bold text-white">{tipoConfig.label}</p>
                </div>

                {/* Resumo dos Dados */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-sm font-semibold text-slate-400 mb-3">Dados do Cadastro</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {formData.nomeMotorista && (
                            <div>
                                <span className="text-slate-400">Nome:</span>
                                <span className="text-white ml-2">{formData.nomeMotorista}</span>
                            </div>
                        )}
                        {formData.cpf && (
                            <div>
                                <span className="text-slate-400">CPF:</span>
                                <span className="text-white ml-2">{formData.cpf}</span>
                            </div>
                        )}
                        {formData.telefone && (
                            <div>
                                <span className="text-slate-400">Telefone:</span>
                                <span className="text-white ml-2">{formData.telefone}</span>
                            </div>
                        )}
                        {formData.placa && (
                            <div>
                                <span className="text-slate-400">Placa:</span>
                                <span className="text-white ml-2">{formData.placa}</span>
                            </div>
                        )}
                        {formData.prioridade && (
                            <div>
                                <span className="text-slate-400">Prioridade:</span>
                                <span className={cn(
                                    'ml-2 px-2 py-0.5 rounded text-xs font-bold',
                                    formData.prioridade === 'urgente' && 'bg-red-500/20 text-red-400',
                                    formData.prioridade === 'alta' && 'bg-amber-500/20 text-amber-400',
                                    formData.prioridade === 'normal' && 'bg-slate-500/20 text-slate-400'
                                )}>
                                    {formData.prioridade.toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Resumo dos Documentos */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-sm font-semibold text-slate-400 mb-3">
                        Documentos ({files.filter(f => f.status !== 'error').length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {files.filter(f => f.status !== 'error').map(file => (
                            <span
                                key={file.id}
                                className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg"
                            >
                                {DOCUMENT_LABELS[file.tipo] || file.tipo}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Validação Final */}
                {(!camposValidos.valido || !documentosValidos.valido) && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Não é possível enviar</span>
                        </div>
                        {!camposValidos.valido && (
                            <p className="text-sm text-red-400/80">
                                Campos obrigatórios faltando: {camposValidos.camposFaltantes.map(c => FIELD_LABELS[c] || c).join(', ')}
                            </p>
                        )}
                        {!documentosValidos.valido && (
                            <p className="text-sm text-red-400/80">
                                Documentos obrigatórios faltando: {documentosValidos.documentosFaltantes.map(d => DOCUMENT_LABELS[d] || d).join(', ')}
                            </p>
                        )}
                    </div>
                )}

                {submitError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{submitError}</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Botões de navegação
    const renderNavigation = () => {
        const canGoNext = () => {
            switch (step) {
                case 1: return !!tipoCadastro;
                case 2: return camposValidos.valido;
                case 3: return true; // Permitir avançar mesmo sem documentos para revisar
                case 4: return camposValidos.valido && documentosValidos.valido;
                default: return false;
            }
        };

        if (submitSuccess) return null;

        return (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                <button
                    onClick={handlePrevStep}
                    disabled={step === 1}
                    className={cn(
                        'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors',
                        step === 1
                            ? 'opacity-50 cursor-not-allowed text-slate-500'
                            : 'bg-white/10 text-white hover:bg-white/20'
                    )}
                >
                    <ChevronLeft className="w-5 h-5" />
                    Voltar
                </button>

                {step < 4 ? (
                    <button
                        onClick={handleNextStep}
                        disabled={!canGoNext()}
                        className={cn(
                            'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors',
                            canGoNext()
                                ? 'bg-benfica-blue text-white hover:bg-benfica-blue/80'
                                : 'opacity-50 cursor-not-allowed bg-slate-600 text-slate-400'
                        )}
                    >
                        Continuar
                        <ChevronRight className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={!canGoNext() || isSubmitting}
                        className={cn(
                            'flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors',
                            canGoNext() && !isSubmitting
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                : 'opacity-50 cursor-not-allowed bg-slate-600 text-slate-400'
                        )}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Enviar Cadastro
                            </>
                        )}
                    </button>
                )}
            </div>
        );
    };

    return (
        <Container>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Novo Cadastro</h1>
                    <p className="text-slate-400">
                        Preencha as informações para criar um novo cadastro
                    </p>
                </div>

                {/* Indicador de Steps */}
                {renderStepIndicator()}

                {/* Conteúdo do Step */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}

                    {/* Navegação */}
                    {renderNavigation()}
                </div>
            </div>
        </Container>
    );
}

export default NovoCadastro;
