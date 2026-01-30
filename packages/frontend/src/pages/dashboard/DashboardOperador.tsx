import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout';
import {
  FileUp,
  Send,
  CheckCircle,
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
  Edit3,
  Loader2,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { filaApi, documentsApi, type DocumentType as ApiDocType } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useSocket, onSubmissionDevolvida, type SubmissionDevolvidaEvent } from '@/hooks/useSocket';

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
  // Documentos OBRIGATÓRIOS (conforme contexto.md)
  { id: 'crlv', label: "CRLV's (Cavalo e Carreta)", shortLabel: 'CRLV', required: true, icon: Truck, color: 'blue' },
  { id: 'antt', label: 'ANTT (Veículo)', shortLabel: 'ANTT', required: true, icon: FileText, color: 'purple' },
  { id: 'cnh', label: 'CNH Proprietário', shortLabel: 'CNH', required: true, icon: User, color: 'emerald' },
  // Documentos OPCIONAIS
  { id: 'endereco', label: 'Comprovante de Endereço', shortLabel: 'Endereço', required: false, icon: MapPin, color: 'amber' },
  { id: 'bancario', label: 'Dados Bancários', shortLabel: 'Bancário', required: false, icon: CreditCard, color: 'cyan' },
  { id: 'rcv', label: 'Certificado RCV', shortLabel: 'RCV', required: false, icon: Shield, color: 'indigo' },
  { id: 'gr', label: 'GR (Gerenciadora de Risco)', shortLabel: 'GR', required: false, icon: Shield, color: 'red' },
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
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export function DashboardOperador() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [classifyingFileId, setClassifyingFileId] = useState<string | null>(null);
  const [showOthersInput, setShowOthersInput] = useState(false);
  const [othersDescription, setOthersDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado do formulário de dados adicionais
  const [formData, setFormData] = useState({
    origem: '',
    destino: '',
    valorMercadoria: '',
    tipoMercadoria: '',
    telMotorista: '',
    telProprietario: '',
    numeroPis: '',
    referenciaComercial1: '',
    referenciaComercial2: '',
    referenciaPessoal1: '',
    referenciaPessoal2: '',
    referenciaPessoal3: '',
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Estado para devolvidos
  const [devolvidosCount, setDevolvidosCount] = useState(0);
  const [newDevolvido, setNewDevolvido] = useState(false);

  // Conectar ao socket
  useSocket();

  // Carregar contagem de devolvidos
  useEffect(() => {
    const loadDevolvidosCount = async () => {
      try {
        const response = await filaApi.list({ status: 'devolvido' });
        if (response.success && response.data) {
          setDevolvidosCount(response.data.length);
        }
      } catch (error) {
        console.error('Erro ao carregar devolvidos:', error);
      }
    };

    loadDevolvidosCount();
  }, []);

  // Ref para arquivos para cleanup no unmount
  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Cleanup de previews ao desmontar
  useEffect(() => {
    return () => {
      filesRef.current.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, []);

  // Listener para novas devoluções via WebSocket
  useEffect(() => {
    const unsub = onSubmissionDevolvida((event: SubmissionDevolvidaEvent) => {
      console.log('[DashboardOperador] Nova devolução:', event);
      setDevolvidosCount(prev => prev + 1);
      setNewDevolvido(true);
      setTimeout(() => setNewDevolvido(false), 5000);
    });

    return () => unsub();
  }, []);

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
    e.preventDefault();
    // Bloqueio removido a pedido do usuário
    // if (!allRequiredComplete) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setUploadProgress(0);
    setUploadStatus('Criando cadastro...');

    try {
      // 1. Criar o cadastro na fila com os dados do formulário
      const createResponse = await filaApi.create({
        origem: formData.origem || undefined,
        destino: formData.destino || undefined,
        tipoMercadoria: formData.tipoMercadoria || undefined,
        valorMercadoria: formData.valorMercadoria ? parseFloat(formData.valorMercadoria) : undefined,
        telMotorista: formData.telMotorista || undefined,
        telProprietario: formData.telProprietario || undefined,
        numeroPis: formData.numeroPis || undefined,
        referenciaComercial1: formData.referenciaComercial1 || undefined,
        referenciaComercial2: formData.referenciaComercial2 || undefined,
        referenciaPessoal1: formData.referenciaPessoal1 || undefined,
        referenciaPessoal2: formData.referenciaPessoal2 || undefined,
        referenciaPessoal3: formData.referenciaPessoal3 || undefined,
      });

      if (!createResponse.success || !createResponse.data) {
        throw new Error(createResponse.error || 'Erro ao criar cadastro');
      }

      const submissionId = createResponse.data.id;
      setUploadStatus('Enviando documentos...');

      // 2. Preparar arquivos para upload
      const classifiedFiles = files.filter(f => f.type !== null);
      const totalFiles = classifiedFiles.length;
      let uploadedCount = 0;
      let hasError = false;

      // 3. Upload de cada arquivo individualmente com progresso
      for (const uploadedFile of classifiedFiles) {
        try {
          // Mapear tipo para o tipo esperado pela API
          const apiType = uploadedFile.type as ApiDocType;

          setUploadStatus(`Enviando ${uploadedFile.file.name}...`);

          // Atualizar status do arquivo para uploading
          setFiles(prev => prev.map(f =>
            f.id === uploadedFile.id
              ? { ...f, uploadStatus: 'uploading' as const, uploadProgress: 0 }
              : f
          ));

          await documentsApi.upload(
            uploadedFile.file,
            submissionId,
            apiType,
            (progress) => {
              // Atualizar progresso individual do arquivo
              setFiles(prev => prev.map(f =>
                f.id === uploadedFile.id
                  ? { ...f, uploadProgress: progress.percentage }
                  : f
              ));

              // Calcular progresso total
              const baseProgress = (uploadedCount / totalFiles) * 100;
              const currentFileProgress = (progress.percentage / totalFiles);
              setUploadProgress(Math.round(baseProgress + currentFileProgress));
            }
          );

          // Marcar arquivo como enviado com sucesso
          setFiles(prev => prev.map(f =>
            f.id === uploadedFile.id
              ? { ...f, uploadStatus: 'success' as const, uploadProgress: 100 }
              : f
          ));

          uploadedCount++;
          setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
        } catch (error) {
          hasError = true;
          const errorMsg = error instanceof Error ? error.message : 'Erro no upload';

          // Marcar arquivo com erro
          setFiles(prev => prev.map(f =>
            f.id === uploadedFile.id
              ? { ...f, uploadStatus: 'error' as const, errorMessage: errorMsg }
              : f
          ));
        }
      }

      if (hasError) {
        setErrorMessage('Alguns arquivos falharam no envio. Você pode tentar novamente.');
        setIsSubmitting(false);
        return;
      }

      setUploadStatus('Finalizando...');
      setUploadProgress(100);
      setSubmitted(true);
      setIsSubmitting(false);

      // Redireciona para a fila de cadastros após 2 segundos
      setTimeout(() => {
        navigate('/dashboard/cadastro-gr');
      }, 2000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro ao enviar cadastro';
      setErrorMessage(errorMsg);
      setIsSubmitting(false);
      setUploadStatus('');
    }
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
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
        {/* Alerta de Devolvidos */}
        {devolvidosCount > 0 && (
          <div
            onClick={() => navigate('/dashboard/minhas-corridas')}
            className={`bg-orange-500/10 border-2 ${newDevolvido ? 'border-orange-500 animate-pulse' : 'border-orange-500/30'} rounded-xl p-4 cursor-pointer hover:bg-orange-500/20 transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${newDevolvido ? 'bg-orange-500' : 'bg-orange-500/20'}`}>
                  <RotateCcw className={`w-5 h-5 ${newDevolvido ? 'text-white' : 'text-orange-400'}`} />
                </div>
                <div>
                  <h3 className="text-white font-bold flex items-center gap-2">
                    Você tem cadastros devolvidos
                    {newDevolvido && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-bounce">
                        NOVO!
                      </span>
                    )}
                  </h3>
                  <p className="text-orange-400/80 text-sm">
                    {devolvidosCount} cadastro{devolvidosCount > 1 ? 's' : ''} aguardando correção
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-orange-400">
                <span className="text-sm font-medium">Ver devolvidos</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-left">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-benfica-blue to-blue-700 rounded-2xl shadow-lg mb-3">
            <FileUp className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Envio de Documentos</h1>
          <p className="text-slate-500 text-sm flex items-center gap-1">
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

        {/* Formulário de Dados Adicionais */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-benfica-blue" />
            Dados do Cadastro
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Origem e Destino */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Origem</label>
              <input
                type="text"
                name="origem"
                value={formData.origem}
                onChange={handleFormChange}
                placeholder="Cidade de origem"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-benfica-blue focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Destino</label>
              <input
                type="text"
                name="destino"
                value={formData.destino}
                onChange={handleFormChange}
                placeholder="Cidade de destino"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-benfica-blue focus:outline-none transition-colors"
              />
            </div>

            {/* Valor e Tipo da Mercadoria */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Valor da Mercadoria (R$)</label>
              <input
                type="number"
                name="valorMercadoria"
                value={formData.valorMercadoria}
                onChange={handleFormChange}
                placeholder="0,00"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-benfica-blue focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tipo da Mercadoria</label>
              <input
                type="text"
                name="tipoMercadoria"
                value={formData.tipoMercadoria}
                onChange={handleFormChange}
                placeholder="Ex: Carga seca, Grãos..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-benfica-blue focus:outline-none transition-colors"
              />
            </div>

            {/* Telefones */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tel. Motorista</label>
              <input
                type="tel"
                name="telMotorista"
                value={formData.telMotorista}
                onChange={handleFormChange}
                placeholder="(00) 00000-0000"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-benfica-blue focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tel. Proprietário</label>
              <input
                type="tel"
                name="telProprietario"
                value={formData.telProprietario}
                onChange={handleFormChange}
                placeholder="(00) 00000-0000"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-benfica-blue focus:outline-none transition-colors"
              />
            </div>

            {/* PIS */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Número PIS</label>
              <input
                type="text"
                name="numeroPis"
                value={formData.numeroPis}
                onChange={handleFormChange}
                placeholder="000.00000.00-0"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-benfica-blue focus:outline-none transition-colors"
              />
            </div>

            {/* Referências Comerciais */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Ref. Comercial 1</label>
              <input
                type="text"
                name="referenciaComercial1"
                value={formData.referenciaComercial1}
                onChange={handleFormChange}
                placeholder="Nome e telefone"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-benfica-blue focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Ref. Comercial 2</label>
              <input
                type="text"
                name="referenciaComercial2"
                value={formData.referenciaComercial2}
                onChange={handleFormChange}
                placeholder="Nome e telefone"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-benfica-blue focus:outline-none transition-colors"
              />
            </div>

            {/* Referências Pessoais */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Ref. Pessoal 1</label>
              <input
                type="text"
                name="referenciaPessoal1"
                value={formData.referenciaPessoal1}
                onChange={handleFormChange}
                placeholder="Nome e telefone"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-benfica-blue focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Ref. Pessoal 2</label>
              <input
                type="text"
                name="referenciaPessoal2"
                value={formData.referenciaPessoal2}
                onChange={handleFormChange}
                placeholder="Nome e telefone"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-benfica-blue focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Ref. Pessoal 3</label>
              <input
                type="text"
                name="referenciaPessoal3"
                value={formData.referenciaPessoal3}
                onChange={handleFormChange}
                placeholder="Nome e telefone"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-benfica-blue focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
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
        {files.filter(f => f.type !== null).length > 0 && !isSubmitting && (
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
                    <div className={`flex items-center gap-2 px-2 py-1 rounded-lg bg-white/10 border ${file.uploadStatus === 'success'
                      ? 'border-emerald-500/50'
                      : file.uploadStatus === 'error'
                        ? 'border-red-500/50'
                        : `${colors.border}/30`
                      }`}>
                      {file.uploadStatus === 'success' && <Check className="w-3 h-3 text-emerald-400" />}
                      {file.uploadStatus === 'error' && <AlertCircle className="w-3 h-3 text-red-400" />}
                      <span className={`text-xs font-bold ${file.uploadStatus === 'success'
                        ? 'text-emerald-400'
                        : file.uploadStatus === 'error'
                          ? 'text-red-400'
                          : colors.text
                        }`}>{label}</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[80px]">{file.file.name}</span>
                    </div>
                    {!isSubmitting && (
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2 h-2 text-white" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mensagem de Pendência (Apenas informativo) */}
        {!allRequiredComplete && !errorMessage && unclassifiedFiles.length > 0 && (
          <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 rounded-lg px-4 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              {`Classifique ${unclassifiedFiles.length} documento${unclassifiedFiles.length > 1 ? 's' : ''}`}
            </span>
          </div>
        )}

        {/* Erro de Upload */}
        {errorMessage && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-2 border border-red-500/30">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="ml-auto p-1 hover:bg-white/10 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Progresso de Upload */}
        {isSubmitting && (
          <div className="bg-benfica-blue/10 border border-benfica-blue/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-benfica-blue animate-spin" />
                <span className="text-sm text-white font-medium">{uploadStatus}</span>
              </div>
              <span className="text-sm font-bold text-benfica-blue">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-benfica-blue to-blue-400 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            {/* Status individual dos arquivos */}
            <div className="flex flex-wrap gap-1 mt-2">
              {files.filter(f => f.type !== null).map((file) => (
                <div
                  key={file.id}
                  className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${file.uploadStatus === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : file.uploadStatus === 'error'
                      ? 'bg-red-500/20 text-red-400'
                      : file.uploadStatus === 'uploading'
                        ? 'bg-benfica-blue/20 text-benfica-blue'
                        : 'bg-slate-700/50 text-slate-400'
                    }`}
                >
                  {file.uploadStatus === 'uploading' && <Loader2 className="w-3 h-3 animate-spin" />}
                  {file.uploadStatus === 'success' && <Check className="w-3 h-3" />}
                  {file.uploadStatus === 'error' && <X className="w-3 h-3" />}
                  <span className="truncate max-w-[100px]">{file.file.name}</span>
                  {file.uploadStatus === 'uploading' && file.uploadProgress !== undefined && (
                    <span className="ml-1">{file.uploadProgress}%</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão de Enviar */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all duration-300 ${!isSubmitting
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:opacity-90 shadow-lg shadow-emerald-500/30 hover:scale-[1.02]'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
        >
          {isSubmitting ? (
            <><Loader2 className="w-6 h-6 animate-spin" /> {uploadStatus || 'Enviando...'}</>
          ) : (
            <><Send className="w-6 h-6" /> Enviar Cadastro</>
          )}
        </button>

        {/* Botão para Tentar Novamente (se houve erro) */}
        {errorMessage && files.some(f => f.uploadStatus === 'error') && (
          <button
            type="button"
            onClick={() => {
              // Resetar status dos arquivos com erro para tentar novamente
              setFiles(prev => prev.map(f =>
                f.uploadStatus === 'error'
                  ? { ...f, uploadStatus: 'pending', uploadProgress: undefined, errorMessage: undefined }
                  : f
              ));
              setErrorMessage(null);
            }}
            className="w-full py-3 rounded-xl border-2 border-amber-500/50 text-amber-400 font-bold hover:bg-amber-500/10 transition-colors"
          >
            Tentar Novamente (arquivos com erro)
          </button>
        )}
      </form>
    </Container>
  );
}
