import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  X,
  FileText,
  Image,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UploadFile } from '@/hooks/useFileUpload';
import { formatFileSize } from '@/hooks/useFileUpload';
import type { DocumentType } from '@/services/api';

// =====================================================
// TIPOS
// =====================================================

interface FileUploadZoneProps {
  files: UploadFile[];
  onAddFiles: (files: FileList | File[], tipo: DocumentType) => void;
  onRemoveFile: (id: string) => void;
  onUpdateFileType: (id: string, tipo: DocumentType) => void;
  onRetryFile: (id: string) => void;
  isUploading: boolean;
  overallProgress: number;
  acceptedTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  defaultTipo?: DocumentType;
  disabled?: boolean;
  className?: string;
}

// Labels dos tipos de documento
const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  crlv: 'CRLV',
  antt: 'ANTT',
  cnh: 'CNH',
  endereco: 'Comp. Endereco',
  bancario: 'Dados Bancarios',
  pamcard: 'PAMCARD',
  gr: 'GR',
  rcv: 'RCV',
  contrato: 'Contrato',
  outros: 'Outros',
};

// =====================================================
// COMPONENTE
// =====================================================

export function FileUploadZone({
  files,
  onAddFiles,
  onRemoveFile,
  onUpdateFileType,
  onRetryFile,
  isUploading,
  overallProgress,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  maxFileSize = 50 * 1024 * 1024,
  maxFiles = 10,
  defaultTipo = 'outros',
  disabled = false,
  className,
}: FileUploadZoneProps) {
  const [selectedTipo, setSelectedTipo] = useState<DocumentType>(defaultTipo);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onAddFiles(acceptedFiles, selectedTipo);
      }
    },
    [onAddFiles, selectedTipo]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: maxFileSize,
    maxFiles: maxFiles - files.length,
    disabled: disabled || isUploading,
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-orange-500" />;
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Seletor de tipo de documento */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Tipo de documento:</label>
        <Select
          value={selectedTipo}
          onValueChange={(value) => setSelectedTipo(value as DocumentType)}
          disabled={disabled || isUploading}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Zona de drop */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive && !isDragReject && 'border-blue-500 bg-blue-50',
          isDragReject && 'border-red-500 bg-red-50',
          !isDragActive && 'border-gray-300 hover:border-gray-400',
          (disabled || isUploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />

        <Upload
          className={cn(
            'mx-auto h-12 w-12 mb-4',
            isDragActive && !isDragReject && 'text-blue-500',
            isDragReject && 'text-red-500',
            !isDragActive && 'text-gray-400'
          )}
        />

        {isDragActive && !isDragReject ? (
          <p className="text-blue-600 font-medium">Solte os arquivos aqui...</p>
        ) : isDragReject ? (
          <p className="text-red-600 font-medium">Arquivo nao permitido</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-500 mt-2">
              PDF, imagens (JPG, PNG) ou documentos Word. Max {Math.round(maxFileSize / 1024 / 1024)}
              MB por arquivo
            </p>
          </>
        )}
      </div>

      {/* Progresso geral */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Enviando arquivos...</span>
            <span className="font-medium">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      )}

      {/* Lista de arquivos */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">
            Arquivos selecionados ({files.length})
          </h4>

          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  file.status === 'error' && 'border-red-200 bg-red-50',
                  file.status === 'success' && 'border-green-200 bg-green-50',
                  file.status === 'uploading' && 'border-blue-200 bg-blue-50',
                  file.status === 'pending' && 'border-gray-200 bg-gray-50'
                )}
              >
                {/* Preview ou icone */}
                <div className="flex-shrink-0">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    getFileIcon(file.file.type)
                  )}
                </div>

                {/* Info do arquivo */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.file.size)} •{' '}
                    <span className="font-medium">{DOCUMENT_TYPE_LABELS[file.tipo]}</span>
                  </p>

                  {/* Progresso individual */}
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="h-1 mt-1" />
                  )}

                  {/* Erro */}
                  {file.error && <p className="text-xs text-red-600 mt-1">{file.error}</p>}
                </div>

                {/* Seletor de tipo (apenas para pendentes) */}
                {file.status === 'pending' && (
                  <Select
                    value={file.tipo}
                    onValueChange={(value) => onUpdateFileType(file.id, value as DocumentType)}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Status icon */}
                <div className="flex-shrink-0">{getStatusIcon(file.status)}</div>

                {/* Acoes */}
                <div className="flex-shrink-0 flex gap-1">
                  {file.status === 'error' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRetryFile(file.id)}
                      className="h-8 w-8 p-0"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}

                  {(file.status === 'pending' || file.status === 'error') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFile(file.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUploadZone;
