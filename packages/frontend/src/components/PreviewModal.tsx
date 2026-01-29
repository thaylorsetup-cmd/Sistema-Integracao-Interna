/**
 * PreviewModal - Modal para visualização de documentos
 * Suporta imagens e PDFs com controles de zoom e navegação
 * Inclui timeout, retry e fallback para download
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
    documentId: string;
    documentName: string;
    mimeType: string;
    onClose: () => void;
}

// Timeouts em ms
const TIMEOUT_PDF = 30000;  // 30 segundos para PDFs
const TIMEOUT_IMAGE = 15000; // 15 segundos para imagens

export function PreviewModal({ documentId, documentName, mimeType, onClose }: PreviewModalProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [downloading, setDownloading] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isPDF = mimeType === 'application/pdf';
    const isImage = mimeType.startsWith('image/');

    // URL com parametro para forçar reload em retry
    const previewUrl = `/api/documents/${documentId}/preview?t=${retryCount}`;

    // Timeout para evitar loading infinito
    useEffect(() => {
        const timeout = isPDF ? TIMEOUT_PDF : TIMEOUT_IMAGE;

        timeoutRef.current = setTimeout(() => {
            if (loading) {
                setLoading(false);
                setError('Tempo limite excedido. O documento pode estar indisponível ou muito grande.');
            }
        }, timeout);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [loading, isPDF, retryCount]);

    // Função para limpar timeout e marcar como carregado
    const clearTimeoutAndSetLoaded = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setLoading(false);
    };

    // Função para tentar novamente
    const handleRetry = () => {
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
                                    Aguarde até {isPDF ? '30' : '15'} segundos
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
                    {isImage && !error && (
                        <div className="flex items-center justify-center min-h-full relative">
                            {/* Loading overlay para imagens */}
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                        <p className="text-slate-400">Carregando imagem...</p>
                                    </div>
                                </div>
                            )}
                            <img
                                key={retryCount}
                                src={previewUrl}
                                alt={documentName}
                                style={{
                                    transform: `scale(${zoom})`,
                                    transformOrigin: 'center',
                                    opacity: loading ? 0 : 1,
                                }}
                                className="max-w-full max-h-full object-contain transition-all duration-200"
                                onLoad={clearTimeoutAndSetLoaded}
                                onError={() => {
                                    clearTimeoutAndSetLoaded();
                                    setError('Erro ao carregar imagem. Verifique se o arquivo existe.');
                                }}
                            />
                        </div>
                    )}

                    {/* PDF - Sempre renderiza para permitir callbacks */}
                    {isPDF && !error && (
                        <div className={`flex justify-center ${loading ? 'opacity-0 absolute' : ''}`}>
                            <Document
                                key={retryCount}
                                file={previewUrl}
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
