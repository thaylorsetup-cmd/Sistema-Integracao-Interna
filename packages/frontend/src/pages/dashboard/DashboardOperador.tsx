import { useState, useCallback, useRef } from 'react';
import { Container } from '@/components/layout';
import {
  FileUp,
  Send,
  CheckCircle,
  Clock,
  FileText,
  Camera,
  X,
  Upload,
  File,
  Sparkles,
  AlertCircle,
  Check,
  Circle,
  User,
  Truck,
  CreditCard,
  Shield,
  MapPin,
  Phone,
  Package,
  FileCheck
} from 'lucide-react';

// Definição dos tipos de documentos do checklist
interface DocumentType {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  required: boolean;
  maxFiles: number;
  icon: React.ElementType;
  color: string;
}

const DOCUMENT_CHECKLIST: DocumentType[] = [
  // Documentos Obrigatórios
  { id: 'crlv', label: "CRLV's (Cavalo e Carreta)", shortLabel: 'CRLV', description: 'Documento do veículo', required: true, maxFiles: 2, icon: Truck, color: 'blue' },
  { id: 'antt', label: 'ANTT (Veículo)', shortLabel: 'ANTT', description: 'Registro da ANTT', required: true, maxFiles: 3, icon: FileText, color: 'purple' },
  { id: 'cnh', label: 'CNH Motorista', shortLabel: 'CNH', description: 'Carteira de habilitação', required: true, maxFiles: 1, icon: User, color: 'emerald' },
  { id: 'comprovante_endereco', label: 'Comprovante de Endereço (Motorista)', shortLabel: 'Endereço', description: 'Comprovante de residência', required: true, maxFiles: 2, icon: MapPin, color: 'amber' },
  { id: 'dados_bancarios', label: 'Dados Bancários (Compatível com ANTT)', shortLabel: 'Bancário', description: 'Conta bancária', required: true, maxFiles: 2, icon: CreditCard, color: 'cyan' },
  { id: 'fretebras', label: 'Print da Consulta FRETEBRAS', shortLabel: 'FRETEBRAS', description: 'Consulta do motorista', required: true, maxFiles: 1, icon: FileCheck, color: 'green' },
  { id: 'pamcard', label: 'Print da Consulta TAG (PAMCARD)', shortLabel: 'PAMCARD', description: 'Consulta de pedágio ou print da rota', required: true, maxFiles: 1, icon: FileCheck, color: 'orange' },
  { id: 'gr', label: 'GR (Liberação da Gerenciadora de Risco)', shortLabel: 'GR', description: 'Liberação de risco', required: true, maxFiles: 2, icon: Shield, color: 'red' },
  { id: 'rcv', label: 'Certificado RCV (Certificado Seguro)', shortLabel: 'RCV', description: 'Certificado de seguro', required: true, maxFiles: 2, icon: Shield, color: 'indigo' },
  // Documentos Opcionais
  { id: 'doc_proprietario', label: 'Documento Proprietário (ANTT Pessoa Física)', shortLabel: 'Doc. Prop.', description: 'Se ANTT pessoa física', required: false, maxFiles: 2, icon: FileText, color: 'slate' },
  { id: 'endereco_proprietario', label: 'Comprovante de Endereço Proprietário', shortLabel: 'End. Prop.', description: 'Se ANTT pessoa física', required: false, maxFiles: 2, icon: MapPin, color: 'slate' },
  { id: 'outros', label: 'Outros Documentos', shortLabel: 'Outros', description: 'ID Rastreador, Espelhamento, Fichas, etc.', required: false, maxFiles: 5, icon: File, color: 'slate' },
];

interface UploadedFile {
  id: string;
  file: File;
  type: string; // ID do tipo de documento
  preview?: string;
}

interface FormData {
  solicitante: string;
  telefone: string;
  referencias: string;
  dadosCarga: string;
  cargaRastreada: 'sim' | 'nao' | '';
  tipoMercadoria: string;
  pis: string;
}

// Cores de cada tipo de documento
const DOC_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: 'bg-blue-500', border: 'border-blue-500/30', text: 'text-blue-400' },
  purple: { bg: 'bg-purple-500', border: 'border-purple-500/30', text: 'text-purple-400' },
  emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  amber: { bg: 'bg-amber-500', border: 'border-amber-500/30', text: 'text-amber-400' },
  cyan: { bg: 'bg-cyan-500', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  green: { bg: 'bg-green-500', border: 'border-green-500/30', text: 'text-green-400' },
  orange: { bg: 'bg-orange-500', border: 'border-orange-500/30', text: 'text-orange-400' },
  red: { bg: 'bg-red-500', border: 'border-red-500/30', text: 'text-red-400' },
  indigo: { bg: 'bg-indigo-500', border: 'border-indigo-500/30', text: 'text-indigo-400' },
  slate: { bg: 'bg-slate-500', border: 'border-slate-500/30', text: 'text-slate-400' },
};

export function DashboardOperador() {
  const [formData, setFormData] = useState<FormData>({
    solicitante: '',
    telefone: '',
    referencias: '',
    dadosCarga: '',
    cargaRastreada: '',
    tipoMercadoria: '',
    pis: '',
  });
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar quais documentos foram enviados
  const getFilesForType = (typeId: string) => files.filter(f => f.type === typeId);

  const isDocTypeComplete = (doc: DocumentType) => {
    const docFiles = getFilesForType(doc.id);
    return docFiles.length > 0;
  };

  // Verificar se todos os documentos obrigatórios foram enviados
  const requiredDocs = DOCUMENT_CHECKLIST.filter(d => d.required);
  const completedRequiredDocs = requiredDocs.filter(isDocTypeComplete);
  const allRequiredDocsComplete = completedRequiredDocs.length === requiredDocs.length;

  // Verificar campos de texto obrigatórios
  const textFieldsComplete =
    formData.solicitante.trim() !== '' &&
    formData.telefone.trim() !== '' &&
    formData.referencias.trim() !== '' &&
    formData.dadosCarga.trim() !== '' &&
    formData.cargaRastreada !== '' &&
    formData.tipoMercadoria.trim() !== '';

  const isValid = allRequiredDocsComplete && textFieldsComplete;

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const processFiles = useCallback((fileList: FileList | File[], targetType?: string) => {
    const newFiles: UploadedFile[] = [];
    const typeToUse = targetType || selectedDocType || 'outros';

    Array.from(fileList).forEach((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const uploadedFile: UploadedFile = { id, file, type: typeToUse };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        uploadedFile.preview = URL.createObjectURL(file);
      }

      newFiles.push(uploadedFile);
    });

    setFiles(prev => [...prev, ...newFiles]);
    setSelectedDocType(null);
  }, [selectedDocType]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleDocTypeClick = (docId: string) => {
    setSelectedDocType(docId);
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSubmitted(true);
    setIsSubmitting(false);

    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        solicitante: '',
        telefone: '',
        referencias: '',
        dadosCarga: '',
        cargaRastreada: '',
        tipoMercadoria: '',
        pis: '',
      });
      setFiles([]);
    }, 3000);
  };

  if (submitted) {
    return (
      <Container>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Documentos Enviados!</h2>
            <p className="text-slate-400">Cadastro enviado para análise</p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-benfica-blue to-blue-700 rounded-2xl shadow-lg shadow-benfica-blue/30 mb-4">
            <FileUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Cadastro de Motorista</h1>
          <p className="text-slate-400 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-benfica-blue" />
            Complete todos os documentos obrigatórios para enviar
          </p>
        </div>

        {/* Progresso do Checklist */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-benfica-blue" />
              Progresso do Cadastro
            </h3>
            <span className="text-sm font-bold">
              <span className={completedRequiredDocs.length === requiredDocs.length ? 'text-emerald-400' : 'text-amber-400'}>
                {completedRequiredDocs.length}
              </span>
              <span className="text-slate-500">/{requiredDocs.length} documentos obrigatórios</span>
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${completedRequiredDocs.length === requiredDocs.length
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  : 'bg-gradient-to-r from-benfica-blue to-blue-500'
                }`}
              style={{ width: `${(completedRequiredDocs.length / requiredDocs.length) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Checklist de Documentos */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-benfica-blue" />
              Checklist de Documentos
              <span className="text-xs text-slate-500 font-normal ml-2">(clique para adicionar)</span>
            </h3>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Documentos Obrigatórios */}
            <div className="mb-6">
              <h4 className="text-xs text-red-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Obrigatórios
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {DOCUMENT_CHECKLIST.filter(d => d.required).map((doc) => {
                  const docFiles = getFilesForType(doc.id);
                  const isComplete = docFiles.length > 0;
                  const colors = DOC_COLORS[doc.color];
                  const Icon = doc.icon;

                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleDocTypeClick(doc.id)}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${isComplete
                          ? `${colors.border} bg-white/5`
                          : 'border-white/10 bg-white/5 hover:border-white/30'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isComplete ? colors.bg : 'bg-slate-700'}`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isComplete ? (
                              <Check className={`w-4 h-4 ${colors.text}`} />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-600" />
                            )}
                            <span className={`text-sm font-bold truncate ${isComplete ? colors.text : 'text-white'}`}>
                              {doc.shortLabel}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{doc.description}</p>
                          {docFiles.length > 0 && (
                            <p className="text-[10px] text-slate-400 mt-1">
                              {docFiles.length} arquivo{docFiles.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documentos Opcionais */}
            <div>
              <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">
                Opcionais
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {DOCUMENT_CHECKLIST.filter(d => !d.required).map((doc) => {
                  const docFiles = getFilesForType(doc.id);
                  const hasFiles = docFiles.length > 0;
                  const Icon = doc.icon;

                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleDocTypeClick(doc.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${hasFiles
                          ? 'border-slate-600 bg-slate-800/50'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-500" />
                        <span className="text-xs text-slate-400">{doc.shortLabel}</span>
                        {hasFiles && (
                          <span className="text-[10px] text-slate-500 ml-auto">{docFiles.length}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Área de Drag & Drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              setSelectedDocType('outros');
              fileInputRef.current?.click();
            }}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragging
                ? 'border-benfica-blue bg-benfica-blue/10 scale-[1.02]'
                : 'border-white/20 bg-white/5 hover:border-white/40'
              }`}
          >
            <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${isDragging ? 'bg-benfica-blue' : 'bg-white/10'
              }`}>
              <Upload className={`w-6 h-6 ${isDragging ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isDragging ? 'Solte os arquivos!' : 'Arraste documentos aqui'}
            </h3>
            <p className="text-xs text-slate-500">
              Os arquivos serão classificados como "Outros" • Clique nos itens acima para categorizar
            </p>
          </div>

          {/* Arquivos Enviados */}
          {files.length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
              <h3 className="text-sm font-bold text-slate-400 mb-3">
                Arquivos Enviados ({files.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {files.map((uploadedFile) => {
                  const docType = DOCUMENT_CHECKLIST.find(d => d.id === uploadedFile.type);
                  const colors = DOC_COLORS[docType?.color || 'slate'];

                  return (
                    <div key={uploadedFile.id} className="relative group">
                      <div className="aspect-square rounded-lg bg-slate-800/50 overflow-hidden flex items-center justify-center">
                        {uploadedFile.preview ? (
                          <img src={uploadedFile.preview} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="w-6 h-6 text-slate-500" />
                        )}
                      </div>
                      <div className={`mt-1 px-2 py-0.5 rounded text-[9px] font-bold text-center ${colors.bg}`}>
                        {docType?.shortLabel || 'Outro'}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(uploadedFile.id); }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Campos de Texto */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-benfica-blue" />
              Informações do Cadastro
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Solicitante */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Solicitante do Cadastro (Nome) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.solicitante}
                  onChange={(e) => handleInputChange('solicitante', e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-benfica-blue focus:outline-none"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  <Phone className="w-3 h-3 inline mr-1" />
                  Telefone Contato (Motorista) <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="(62) 99999-9999"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-benfica-blue focus:outline-none"
                />
              </div>

              {/* Referências */}
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">
                  Referências (3 Pessoais + 3 Comerciais) <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.referencias}
                  onChange={(e) => handleInputChange('referencias', e.target.value)}
                  placeholder="Liste as referências pessoais e comerciais..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-benfica-blue focus:outline-none resize-none"
                />
              </div>

              {/* Dados da Carga */}
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">
                  <Package className="w-3 h-3 inline mr-1" />
                  Dados da Carga (Origem, Destino, Mercadoria, Valor, Vendedor) <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.dadosCarga}
                  onChange={(e) => handleInputChange('dadosCarga', e.target.value)}
                  placeholder="Ex: Goiânia → São Paulo, Eletrônicos, R$ 150.000, Fornecedor XYZ"
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-benfica-blue focus:outline-none resize-none"
                />
              </div>

              {/* Carga Rastreada */}
              <div>
                <label className="block text-xs text-slate-500 mb-2">
                  Carga Rastreada (Rastreador) <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cargaRastreada"
                      value="sim"
                      checked={formData.cargaRastreada === 'sim'}
                      onChange={(e) => handleInputChange('cargaRastreada', e.target.value)}
                      className="w-4 h-4 text-benfica-blue"
                    />
                    <span className="text-sm text-white">Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cargaRastreada"
                      value="nao"
                      checked={formData.cargaRastreada === 'nao'}
                      onChange={(e) => handleInputChange('cargaRastreada', e.target.value)}
                      className="w-4 h-4 text-benfica-blue"
                    />
                    <span className="text-sm text-white">Não</span>
                  </label>
                </div>
              </div>

              {/* Tipo de Mercadoria e Valor */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Tipo de Mercadoria e Valor <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tipoMercadoria}
                  onChange={(e) => handleInputChange('tipoMercadoria', e.target.value)}
                  placeholder="Ex: Eletrônicos - R$ 150.000"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-benfica-blue focus:outline-none"
                />
              </div>

              {/* PIS (Opcional) */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  PIS (Em caso de ANTT Pessoa Física)
                </label>
                <input
                  type="text"
                  value={formData.pis}
                  onChange={(e) => handleInputChange('pis', e.target.value)}
                  placeholder="Opcional"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-benfica-blue focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Mensagem de Validação */}
          {!isValid && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-400 font-bold mb-1">Para enviar o cadastro:</p>
                  <ul className="text-amber-400/80 space-y-1">
                    {!allRequiredDocsComplete && (
                      <li>• Adicione todos os {requiredDocs.length - completedRequiredDocs.length} documentos obrigatórios restantes</li>
                    )}
                    {!textFieldsComplete && (
                      <li>• Preencha todos os campos de texto obrigatórios</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Botão de Enviar */}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${isValid && !isSubmitting
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:opacity-90 shadow-lg shadow-emerald-500/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
          >
            {isSubmitting ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                Enviando Cadastro...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar Cadastro para Análise
              </>
            )}
          </button>
        </form>
      </div>
    </Container>
  );
}
