import { useState, useCallback } from 'react';
import { documentsApi, type DocumentType, type UploadProgress, type Document } from '@/services/api';

// =====================================================
// TIPOS
// =====================================================

export interface FileWithPreview extends File {
  preview?: string;
  id?: string;
}

export interface UploadFile {
  id: string;
  file: File;
  tipo: DocumentType;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  document?: Document;
}

export interface UseFileUploadOptions {
  maxFileSize?: number; // em bytes, padrao 50MB
  acceptedTypes?: string[]; // MIME types aceitos
  maxFiles?: number; // maximo de arquivos
  onUploadComplete?: (documents: Document[]) => void;
  onError?: (error: string) => void;
}

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB
const DEFAULT_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// =====================================================
// HOOK
// =====================================================

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    maxFileSize = DEFAULT_MAX_SIZE,
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
    maxFiles = 10,
    onUploadComplete,
    onError,
  } = options;

  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  // Gerar ID unico
  const generateId = () => `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Validar arquivo
  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        return `Arquivo muito grande. Maximo: ${Math.round(maxFileSize / 1024 / 1024)}MB`;
      }

      if (!acceptedTypes.includes(file.type)) {
        return 'Tipo de arquivo nao permitido';
      }

      return null;
    },
    [maxFileSize, acceptedTypes]
  );

  // Criar preview para imagens
  const createPreview = (file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return undefined;
  };

  // Adicionar arquivos
  const addFiles = useCallback(
    (newFiles: FileList | File[], tipo: DocumentType) => {
      const fileArray = Array.from(newFiles);

      if (files.length + fileArray.length > maxFiles) {
        onError?.(`Maximo de ${maxFiles} arquivos permitidos`);
        return;
      }

      const uploadFiles: UploadFile[] = fileArray.map((file) => {
        const error = validateFile(file);
        return {
          id: generateId(),
          file,
          tipo,
          preview: createPreview(file),
          progress: 0,
          status: error ? 'error' : 'pending',
          error: error || undefined,
        };
      });

      setFiles((prev) => [...prev, ...uploadFiles]);
    },
    [files.length, maxFiles, validateFile, onError]
  );

  // Remover arquivo
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  // Limpar todos
  const clearFiles = useCallback(() => {
    files.forEach((f) => {
      if (f.preview) {
        URL.revokeObjectURL(f.preview);
      }
    });
    setFiles([]);
    setOverallProgress(0);
  }, [files]);

  // Atualizar tipo de um arquivo
  const updateFileType = useCallback((id: string, tipo: DocumentType) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, tipo } : f)));
  }, []);

  // Upload de um arquivo individual
  const uploadSingleFile = async (
    uploadFile: UploadFile,
    submissionId: string
  ): Promise<Document | null> => {
    try {
      // Atualizar status para uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f))
      );

      const response = await documentsApi.upload(
        uploadFile.file,
        submissionId,
        uploadFile.tipo,
        (progress: UploadProgress) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, progress: progress.percentage } : f
            )
          );
        }
      );

      if (response.success && response.data) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: 'success', progress: 100, document: response.data }
              : f
          )
        );
        return response.data;
      } else {
        throw new Error(response.error || 'Erro no upload');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'error', error: errorMessage } : f
        )
      );
      return null;
    }
  };

  // Upload de todos os arquivos
  const uploadAll = useCallback(
    async (submissionId: string): Promise<Document[]> => {
      const pendingFiles = files.filter((f) => f.status === 'pending');

      if (pendingFiles.length === 0) {
        return [];
      }

      setIsUploading(true);
      setOverallProgress(0);

      const uploadedDocuments: Document[] = [];
      let completedCount = 0;

      // Upload sequencial para melhor controle de progresso
      for (const file of pendingFiles) {
        const document = await uploadSingleFile(file, submissionId);
        if (document) {
          uploadedDocuments.push(document);
        }
        completedCount++;
        setOverallProgress(Math.round((completedCount / pendingFiles.length) * 100));
      }

      setIsUploading(false);

      if (uploadedDocuments.length > 0) {
        onUploadComplete?.(uploadedDocuments);
      }

      return uploadedDocuments;
    },
    [files, onUploadComplete]
  );

  // Upload de multiplos arquivos de uma vez (mais eficiente)
  const uploadMultiple = useCallback(
    async (submissionId: string): Promise<Document[]> => {
      const pendingFiles = files.filter((f) => f.status === 'pending');

      if (pendingFiles.length === 0) {
        return [];
      }

      setIsUploading(true);

      // Atualizar todos para uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'pending' ? { ...f, status: 'uploading', progress: 0 } : f
        )
      );

      try {
        const filesWithTypes = pendingFiles.map((f) => ({
          file: f.file,
          tipo: f.tipo,
        }));

        const response = await documentsApi.uploadMultiple(
          filesWithTypes,
          submissionId,
          (progress: UploadProgress) => {
            setOverallProgress(progress.percentage);
            // Atualizar progresso de todos os arquivos
            setFiles((prev) =>
              prev.map((f) =>
                f.status === 'uploading' ? { ...f, progress: progress.percentage } : f
              )
            );
          }
        );

        if (response.success && response.data) {
          // Marcar todos como sucesso
          setFiles((prev) =>
            prev.map((f) => (f.status === 'uploading' ? { ...f, status: 'success', progress: 100 } : f))
          );

          onUploadComplete?.(response.data);
          return response.data;
        } else {
          throw new Error(response.error || 'Erro no upload');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

        setFiles((prev) =>
          prev.map((f) =>
            f.status === 'uploading' ? { ...f, status: 'error', error: errorMessage } : f
          )
        );

        onError?.(errorMessage);
        return [];
      } finally {
        setIsUploading(false);
      }
    },
    [files, onUploadComplete, onError]
  );

  // Retry de arquivo com erro
  const retryFile = useCallback((id: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: 'pending', progress: 0, error: undefined } : f
      )
    );
  }, []);

  // Estatisticas
  const stats = {
    total: files.length,
    pending: files.filter((f) => f.status === 'pending').length,
    uploading: files.filter((f) => f.status === 'uploading').length,
    success: files.filter((f) => f.status === 'success').length,
    error: files.filter((f) => f.status === 'error').length,
    totalSize: files.reduce((acc, f) => acc + f.file.size, 0),
  };

  return {
    // Estado
    files,
    isUploading,
    overallProgress,
    stats,

    // Acoes
    addFiles,
    removeFile,
    clearFiles,
    updateFileType,
    uploadAll,
    uploadMultiple,
    retryFile,

    // Helpers
    validateFile,
    acceptedTypes,
    maxFileSize,
    maxFiles,
  };
}

// =====================================================
// HELPER - Formatar tamanho de arquivo
// =====================================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// =====================================================
// HELPER - Obter icone por tipo de arquivo
// =====================================================

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'file-text';
  if (mimeType.includes('word')) return 'file-text';
  return 'file';
}
