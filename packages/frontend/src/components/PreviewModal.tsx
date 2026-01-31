/**
 * PreviewModal - Modal para visualização de documentos
 * Suporta imagens e PDFs com controles de zoom e navegação
 * Usa Axios para buscar documento com autenticação via cookies
 */
import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
    X,
    Download,
    ZoomIn,
    ZoomOut,
    ChevronLeft,
    ChevronRight,
    FileText,
    Image as ImageIcon,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { documentsApi } from '@/services/api';

// Configurar worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

// Importar estilos do react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface PreviewModalProps {
    documentId?: string; // Opcional se fileUrl for fornecido
    documentName: string;
    mimeType: string;
    onClose: () => void;
    fileUrl?: string; // URL blob local ou externa
}

// Timeout em ms
const FETCH_TIMEOUT = 30000; // 30 segundos

export function PreviewModal({ documentId, documentName, mimeType, onClose, fileUrl }: PreviewModalProps) {
    const [loading, setLoading] = useState(!fileUrl);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [downloading, setDownloading] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [blobUrl, setBlobUrl] = useState<string | null>(fileUrl || null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isPDF = mimeType === 'application/pdf';
    const isImage = mimeType.startsWith('image/');

    // Buscar documento via Axios (com cookies de autenticação) APENAS se nao tiver fileUrl
    useEffect(() => {
        if (fileUrl) {
            setLoading(false);
            return;
        }

        if (!documentId) return;

        let isMounted = true;
        let objectUrl: string | null = null;

        const fetchDocument = async () => {
            setLoading(true);
            setError(null);

            // Timeout para evitar loading infinito
            timeoutRef.current = setTimeout(() => {
                if (isMounted && loading) {
                    setLoading(false);
                    setError('Tempo limite excedido. O documento pode estar indisponível ou muito grande.');
                }
            }, FETCH_TIMEOUT);

            try {
                const blob = await documentsApi.download(documentId);

                if (isMounted) {
                    // Limpar URL anterior se existir
                    if (blobUrl) {
                        URL.revokeObjectURL(blobUrl);
                    }

                    objectUrl = URL.createObjectURL(blob);
                    setBlobUrl(objectUrl);

                    // Para imagens, marcar como carregado imediatamente
                    // Para PDFs, o onLoadSuccess do Document fará isso
                    if (isImage) {
                        if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current);
                        }
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.error('Erro ao buscar documento:', err);
                if (isMounted) {
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                    }
                    setLoading(false);
                    setError('Erro ao carregar documento. Verifique sua conexão ou tente baixar o arquivo.');
                }
            }
        };

        fetchDocument();

        return () => {
            isMounted = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [documentId, retryCount]);

    // Limpar blobUrl ao desmontar
    useEffect(() => {
        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [blobUrl]);

    // Função para limpar timeout e marcar como carregado
    const clearTimeoutAndSetLoaded = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setLoading(false);
    };

    // Função para tentar novamente
    const handleRetry = () => {
        setBlobUrl(null);
        setLoading(true);
        setError(null);
        setRetryCount(prev => prev + 1);
    };

    const handleDownload = async () => {
        try {
            setDownloading(true);
            const blob = await documentsApi.download(documentId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = documentName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao baixar arquivo:', error);
            alert('Erro ao baixar arquivo');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            {/* Backdrop escuro */}
            <div
                className="absolute inset-0 bg-black/95 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Container do modal */}
            <div className="relative w-full max-w-7xl h-[92vh] bg-slate-950 rounded-2xl border border-white/20 shadow-2xl flex flex-col">
                {/* Header fixo com controles */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900 flex-shrink-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isPDF && <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />}
                        {isImage && <ImageIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />}
                        <h3 className="text-white font-semibold text-lg truncate" title={documentName}>
                            {documentName}
                        </h3>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Controles de zoom */}
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
                            <button
                                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                                className="text-white hover:text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                disabled={zoom <= 0.5}
                                title="Diminuir zoom"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-slate-300 font-mono w-12 text-center">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                                className="text-white hover:text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                disabled={zoom >= 3}
                                title="Aumentar zoom"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Navegação de páginas (apenas para PDF) */}
                        {isPDF && totalPages > 0 && (
                            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="text-white hover:text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Página anterior"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-slate-300 font-mono">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="text-white hover:text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Próxima página"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Botão de download */}
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-blue-500/30 text-blue-400 transition-colors disabled:opacity-50"
                            title="Download do arquivo"
                        >
                            <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
                        </button>

                        {/* Botão fechar */}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Fechar"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Área de conteúdo scrollável */}
                <div className="flex-1 overflow-auto p-6 bg-slate-900/50">
                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                <p className="text-slate-400">Carregando documento...</p>
                                <p className="text-xs text-slate-500">
                                    Aguarde até 30 segundos
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Erro com opções de retry e download */}
                    {error && !loading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md text-center">
                                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                                <p className="text-red-400 mb-4">{error}</p>
                                <div className="flex gap-3 justify-center flex-wrap">
                                    <button
                                        onClick={handleRetry}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 border border-blue-500/30 transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Tentar novamente
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        disabled={downloading}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-400 border border-emerald-500/30 transition-colors disabled:opacity-50"
                                    >
                                        <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
                                        Baixar arquivo
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Imagem */}
                    {isImage && !error && blobUrl && (
                        <div className="flex items-center justify-center min-h-full relative">
                            <img
                                key={retryCount}
                                src={blobUrl}
                                alt={documentName}
                                style={{
                                    transform: `scale(${zoom})`,
                                    transformOrigin: 'center',
                                }}
                                className="max-w-full max-h-full object-contain transition-all duration-200"
                                onError={() => {
                                    setError('Erro ao carregar imagem. Verifique se o arquivo existe.');
                                }}
                            />
                        </div>
                    )}

                    {/* PDF - Renderiza apenas quando blobUrl estiver disponível */}
                    {isPDF && !error && blobUrl && (
                        <div className="flex justify-center">
                            <Document
                                key={retryCount}
                                file={blobUrl}
                                onLoadSuccess={({ numPages }) => {
                                    setTotalPages(numPages);
                                    clearTimeoutAndSetLoaded();
                                }}
                                onLoadError={(err) => {
                                    console.error('Erro ao carregar PDF:', err);
                                    clearTimeoutAndSetLoaded();
                                    setError('Erro ao carregar PDF. Tente baixar o arquivo diretamente.');
                                }}
                                loading={<></>}
                                className="pdf-document"
                            >
                                <Page
                                    pageNumber={currentPage}
                                    scale={zoom}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    className="shadow-2xl"
                                    loading={
                                        <div className="flex items-center justify-center p-8">
                                            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                        </div>
                                    }
                                />
                            </Document>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
