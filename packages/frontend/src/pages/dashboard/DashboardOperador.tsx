import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout';
import {
  FileUp,
  Send,
  CheckCircle,
  Clock,
  FileText,
  X,
  Upload,
  File,
  Sparkles,
  AlertCircle,
  Check,
  User,
  Truck,
  CreditCard,
  Shield,
  MapPin,
  FileCheck,
  Image,
  Tag,
  Edit3
} from 'lucide-react';

// Tipos de documentos
interface DocumentType {
  id: string;
  label: string;
  shortLabel: string;
  required: boolean;
  icon: React.ElementType;
  color: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  { id: 'crlv', label: "CRLV's (Cavalo e Carreta)", shortLabel: 'CRLV', required: true, icon: Truck, color: 'blue' },
  { id: 'antt', label: 'ANTT (Veículo)', shortLabel: 'ANTT', required: true, icon: FileText, color: 'purple' },
  { id: 'cnh', label: 'CNH Motorista', shortLabel: 'CNH', required: true, icon: User, color: 'emerald' },
  { id: 'endereco', label: 'Comprovante de Endereço', shortLabel: 'Endereço', required: true, icon: MapPin, color: 'amber' },
  { id: 'bancario', label: 'Dados Bancários', shortLabel: 'Bancário', required: true, icon: CreditCard, color: 'cyan' },
  { id: 'pamcard', label: 'PAMCARD/TAG', shortLabel: 'PAMCARD', required: true, icon: FileCheck, color: 'orange' },
  { id: 'gr', label: 'GR (Gerenciadora de Risco)', shortLabel: 'GR', required: true, icon: Shield, color: 'red' },
  { id: 'rcv', label: 'Certificado RCV', shortLabel: 'RCV', required: true, icon: Shield, color: 'indigo' },
  { id: 'doc_prop', label: 'Doc. Proprietário (ANTT PF)', shortLabel: 'Doc.Prop', required: false, icon: FileText, color: 'slate' },
  { id: 'end_prop', label: 'Endereço Proprietário', shortLabel: 'End.Prop', required: false, icon: MapPin, color: 'slate' },
];

const DOC_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500' },
  cyan: { bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500' },
  green: { bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500' },
  red: { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500' },
  indigo: { bg: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500' },
  slate: { bg: 'bg-slate-500', text: 'text-slate-400', border: 'border-slate-500' },
  pink: { bg: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500' },
};

interface UploadedFile {
  id: string;
  file: File;
  type: string | null;
  customDescription?: string;
  preview?: string;
}

export function DashboardOperador() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [classifyingFileId, setClassifyingFileId] = useState<string | null>(null);
  const [showOthersInput, setShowOthersInput] = useState(false);
  const [othersDescription, setOthersDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Arquivos não classificados
  const unclassifiedFiles = files.filter(f => f.type === null);
  // Arquivos classificados por tipo
  const getFilesForType = (typeId: string) => files.filter(f => f.type === typeId);

  // Verificar documentos obrigatórios
  const requiredDocs = DOCUMENT_TYPES.filter(d => d.required);
  const completedDocs = requiredDocs.filter(d => getFilesForType(d.id).length > 0);
  const allRequiredComplete = completedDocs.length === requiredDocs.length && unclassifiedFiles.length === 0;

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles: UploadedFile[] = [];
    Array.from(fileList).forEach((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const uploadedFile: UploadedFile = { id, file, type: null };
      if (file.type.startsWith('image/')) {
        uploadedFile.preview = URL.createObjectURL(file);
      }
      newFiles.push(uploadedFile);
    });
    setFiles(prev => [...prev, ...newFiles]);

    // Automaticamente abrir classificação para o primeiro arquivo novo
    if (newFiles.length > 0) {
      setClassifyingFileId(newFiles[0].id);
    }
  }, []);

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
      e.target.value = '';
    }
  };

  const classifyFile = (fileId: string, typeId: string, customDesc?: string) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId
        ? { ...f, type: typeId, customDescription: customDesc }
        : f
    ));

    // Fechar modal e ir para próximo arquivo não classificado
    setClassifyingFileId(null);
    setShowOthersInput(false);
    setOthersDescription('');

    // Se tem mais arquivos para classificar, abrir o próximo
    setTimeout(() => {
      const nextUnclassified = files.find(f => f.type === null && f.id !== fileId);
      if (nextUnclassified) {
        setClassifyingFileId(nextUnclassified.id);
      }
    }, 100);
  };

  const handleOthersClick = () => {
    setShowOthersInput(true);
  };

  const confirmOthers = () => {
    if (classifyingFileId && othersDescription.trim()) {
      classifyFile(classifyingFileId, 'outros', othersDescription.trim());
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
    if (classifyingFileId === id) {
      setClassifyingFileId(null);
      setShowOthersInput(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRequiredComplete) return;
    setIsSubmitting(true);

    // TODO: Aqui será integrado com o backend para enviar os arquivos
    // Por enquanto, simula o envio e redireciona para o CadastroGR
    await new Promise(resolve => setTimeout(resolve, 2000));

    setSubmitted(true);
    setIsSubmitting(false);

    // Redireciona para a fila de cadastros após 2 segundos
    setTimeout(() => {
      navigate('/dashboard/cadastro-gr');
    }, 2000);
  };

  if (submitted) {
    return (
      <Container>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-4xl font-black text-white mb-2">Enviado! 🎉</h2>
            <p className="text-slate-400 text-lg mb-4">Cadastro enviado para análise</p>
            <p className="text-sm text-benfica-blue">Redirecionando para a fila de cadastros...</p>
          </div>
        </div>
      </Container>
    );
  }

  const classifyingFile = files.find(f => f.id === classifyingFileId);

  return (
    <Container>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-benfica-blue to-blue-700 rounded-2xl shadow-lg mb-3">
            <FileUp className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Cadastro de Motorista</h1>
          <p className="text-slate-500 text-sm flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            Arraste e classifique os documentos
          </p>
        </div>

        {/* Barra de Progresso */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Progresso</span>
            <span className="text-sm font-bold">
              <span className={completedDocs.length === requiredDocs.length ? 'text-emerald-400' : 'text-amber-400'}>
                {completedDocs.length}
              </span>
              <span className="text-slate-600">/{requiredDocs.length} obrigatórios</span>
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${completedDocs.length === requiredDocs.length ? 'bg-emerald-500' : 'bg-benfica-blue'
                }`}
              style={{ width: `${(completedDocs.length / requiredDocs.length) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Área de Drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${isDragging
              ? 'border-benfica-blue bg-benfica-blue/10 scale-[1.02]'
              : 'border-white/20 bg-white/5 hover:border-white/40'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${isDragging ? 'bg-benfica-blue' : 'bg-white/10'
              }`}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">
              {isDragging ? 'Solte aqui!' : 'Arraste os documentos'}
            </h3>
            <p className="text-sm text-slate-500">ou clique para selecionar • PDF, JPG, PNG</p>
          </div>

          {/* MODAL DE CLASSIFICAÇÃO */}
          {classifyingFile && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header do Modal */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-benfica-blue rounded-lg flex items-center justify-center">
                      <Tag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Qual documento é esse?</h3>
                      <p className="text-xs text-slate-400 truncate max-w-[250px]">
                        {classifyingFile.preview ? '📷' : '📄'} {classifyingFile.file.name}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setClassifyingFileId(null); setShowOthersInput(false); }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Preview do arquivo */}
                {classifyingFile.preview && (
                  <div className="mb-4 rounded-lg overflow-hidden bg-slate-800 h-32 flex items-center justify-center">
                    <img
                      src={classifyingFile.preview}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}

                {!showOthersInput ? (
                  <>
                    {/* Grid de Tipos - Obrigatórios */}
                    <p className="text-xs text-red-400 font-bold mb-2">OBRIGATÓRIOS</p>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {DOCUMENT_TYPES.filter(d => d.required).map((docType) => {
                        const colors = DOC_COLORS[docType.color];
                        const Icon = docType.icon;
                        const count = getFilesForType(docType.id).length;

                        return (
                          <button
                            key={docType.id}
                            type="button"
                            onClick={() => classifyFile(classifyingFile.id, docType.id)}
                            className={`p-3 rounded-xl border-2 transition-all hover:scale-105 hover:border-white/50 ${count > 0 ? `${colors.border} bg-white/5` : 'border-white/10 bg-white/5'
                              }`}
                          >
                            <div className={`w-8 h-8 mx-auto rounded-lg ${colors.bg} flex items-center justify-center mb-1`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs font-bold text-white">{docType.shortLabel}</p>
                            {count > 0 && (
                              <p className="text-[10px] text-emerald-400">+{count} já</p>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Opcionais */}
                    <p className="text-xs text-slate-500 font-bold mb-2">OPCIONAIS</p>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {DOCUMENT_TYPES.filter(d => !d.required).map((docType) => {
                        const colors = DOC_COLORS[docType.color];
                        const Icon = docType.icon;

                        return (
                          <button
                            key={docType.id}
                            type="button"
                            onClick={() => classifyFile(classifyingFile.id, docType.id)}
                            className="p-3 rounded-xl border-2 border-white/10 bg-white/5 hover:border-white/30 transition-all"
                          >
                            <div className={`w-8 h-8 mx-auto rounded-lg ${colors.bg} flex items-center justify-center mb-1`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs font-bold text-slate-400">{docType.shortLabel}</p>
                          </button>
                        );
                      })}

                      {/* Botão OUTROS */}
                      <button
                        type="button"
                        onClick={handleOthersClick}
                        className="p-3 rounded-xl border-2 border-dashed border-pink-500/50 bg-pink-500/10 hover:bg-pink-500/20 transition-all"
                      >
                        <div className="w-8 h-8 mx-auto rounded-lg bg-pink-500 flex items-center justify-center mb-1">
                          <Edit3 className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xs font-bold text-pink-400">OUTROS</p>
                      </button>
                    </div>
                  </>
                ) : (
                  /* Input para OUTROS */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white font-bold mb-2">
                        Descreva o documento:
                      </label>
                      <input
                        type="text"
                        value={othersDescription}
                        onChange={(e) => setOthersDescription(e.target.value)}
                        placeholder="Ex: Ficha de ativação do rastreador"
                        autoFocus
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowOthersInput(false)}
                        className="flex-1 py-3 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 transition-colors"
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        onClick={confirmOthers}
                        disabled={!othersDescription.trim()}
                        className={`flex-1 py-3 rounded-xl font-bold transition-colors ${othersDescription.trim()
                          ? 'bg-pink-500 text-white hover:bg-pink-600'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          }`}
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                )}

                {/* Botão de remover arquivo */}
                <button
                  type="button"
                  onClick={() => removeFile(classifyingFile.id)}
                  className="w-full mt-4 py-2 text-red-400 text-sm hover:text-red-300 transition-colors"
                >
                  Remover este arquivo
                </button>
              </div>
            </div>
          )}

          {/* Arquivos Não Classificados */}
          {unclassifiedFiles.length > 0 && !classifyingFileId && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Clique para classificar ({unclassifiedFiles.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {unclassifiedFiles.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setClassifyingFileId(file.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors group"
                  >
                    {file.preview ? <Image className="w-4 h-4" /> : <File className="w-4 h-4" />}
                    <span className="text-sm truncate max-w-[150px]">{file.file.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Checklist de Documentos Obrigatórios */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-bold text-white mb-3">Documentos Obrigatórios</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {requiredDocs.map((doc) => {
                const docFiles = getFilesForType(doc.id);
                const isComplete = docFiles.length > 0;
                const colors = DOC_COLORS[doc.color];
                const Icon = doc.icon;

                return (
                  <div
                    key={doc.id}
                    className={`p-2 rounded-lg border text-center transition-all ${isComplete ? `${colors.border} bg-white/5` : 'border-white/10 bg-white/5 opacity-50'
                      }`}
                  >
                    <div className={`w-6 h-6 mx-auto rounded ${isComplete ? colors.bg : 'bg-slate-700'} flex items-center justify-center mb-1`}>
                      {isComplete ? <Check className="w-3 h-3 text-white" /> : <Icon className="w-3 h-3 text-white/50" />}
                    </div>
                    <p className={`text-[10px] font-bold ${isComplete ? colors.text : 'text-slate-500'}`}>
                      {doc.shortLabel}
                    </p>
                    {docFiles.length > 0 && (
                      <p className="text-[9px] text-emerald-400">{docFiles.length} ✓</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Arquivos Classificados */}
          {files.filter(f => f.type !== null).length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-bold text-slate-400 mb-3">
                Arquivos Prontos ({files.filter(f => f.type !== null).length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {files.filter(f => f.type !== null).map((file) => {
                  const docType = DOCUMENT_TYPES.find(d => d.id === file.type);
                  const colors = file.type === 'outros' ? DOC_COLORS.pink : DOC_COLORS[docType?.color || 'slate'];
                  const label = file.type === 'outros' ? file.customDescription : docType?.shortLabel;

                  return (
                    <div key={file.id} className="relative group">
                      <div className={`flex items-center gap-2 px-2 py-1 rounded-lg bg-white/10 border ${colors.border}/30`}>
                        <span className={`text-xs font-bold ${colors.text}`}>{label}</span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[80px]">{file.file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2 h-2 text-white" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mensagem de Erro */}
          {!allRequiredComplete && files.length > 0 && (
            <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 rounded-lg px-4 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                {unclassifiedFiles.length > 0
                  ? `Classifique ${unclassifiedFiles.length} documento${unclassifiedFiles.length > 1 ? 's' : ''}`
                  : `Faltam ${requiredDocs.length - completedDocs.length} documentos obrigatórios`
                }
              </span>
            </div>
          )}

          {/* Botão de Enviar */}
          <button
            type="submit"
            disabled={!allRequiredComplete || isSubmitting}
            className={`w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all duration-300 ${allRequiredComplete && !isSubmitting
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:opacity-90 shadow-lg shadow-emerald-500/30 hover:scale-[1.02]'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
          >
            {isSubmitting ? (
              <><Clock className="w-6 h-6 animate-spin" /> Enviando...</>
            ) : (
              <><Send className="w-6 h-6" /> Enviar Cadastro</>
            )}
          </button>
        </form>
      </div>
    </Container>
  );
}
