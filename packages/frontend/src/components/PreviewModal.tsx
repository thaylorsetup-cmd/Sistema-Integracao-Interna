/**
 * PreviewModal - Modal para visualização de documentos
 * Suporta imagens e PDFs com controles de zoom e navegação
 */
import { useState } from 'react';
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

export function PreviewModal({ documentId, documentName, mimeType, onClose }: PreviewModalProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [downloading, setDownloading] = useState(false);

    const isPDF = mimeType === 'application/pdf';
    const isImage = mimeType.startsWith('image/');

    const previewUrl = `/api/documents/${documentId}/preview`;

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
                            </div>
                        </div>
                    )}

                    {/* Erro */}
                    {error && (
                        <div className="flex items-center justify-center h-full">
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md">
                                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                                <p className="text-red-400 text-center">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Conteúdo */}
                    {!loading && !error && (
                        <>
                            {/* Imagem */}
                            {isImage && (
                                <div className="flex items-center justify-center min-h-full">
                                    <img
                                        src={previewUrl}
                                        alt={documentName}
                                        style={{
                                            transform: `scale(${zoom})`,
                                            transformOrigin: 'center',
                                        }}
                                        className="max-w-full max-h-full object-contain transition-transform duration-200"
                                        onLoad={() => setLoading(false)}
                                        onError={() => {
                                            setLoading(false);
                                            setError('Erro ao carregar imagem');
                                        }}
                                    />
                                </div>
                            )}

                            {/* PDF */}
                            {isPDF && (
                                <div className="flex justify-center">
                                    <Document
                                        file={previewUrl}
                                        onLoadSuccess={({ numPages }) => {
                                            setTotalPages(numPages);
                                            setLoading(false);
                                        }}
                                        onLoadError={(error) => {
                                            console.error('Erro ao carregar PDF:', error);
                                            setLoading(false);
                                            setError('Erro ao carregar PDF');
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
