/**
 * CPFSearchInput - Campo de CPF com busca automática no SSW
 * 
 * Características:
 * - Máscara de CPF (000.000.000-00)
 * - Debounce de 800ms para não sobrecarregar a API
 * - Indicador de loading durante busca
 * - Feedback visual (sucesso/erro)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';
import { searchDriverByCPF, formatCPF, cleanCPF, isValidCPF } from '@/services/sswService';
import type { DriverData } from '@/types/ssw.types';

interface CPFSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onDriverFound?: (driver: DriverData) => void;
    onDriverNotFound?: () => void;
    onError?: (error: string) => void;
    placeholder?: string;
    disabled?: boolean;
    autoSearch?: boolean;
    debounceMs?: number;
    className?: string;
    label?: string;
    required?: boolean;
}

type SearchStatus = 'idle' | 'searching' | 'found' | 'not_found' | 'error' | 'offline';

export function CPFSearchInput({
    value,
    onChange,
    onDriverFound,
    onDriverNotFound,
    onError,
    placeholder = '000.000.000-00',
    disabled = false,
    autoSearch = true,
    debounceMs = 800,
    className = '',
    label = 'CPF do Motorista',
    required = false
}: CPFSearchInputProps) {
    const [status, setStatus] = useState<SearchStatus>('idle');
    const [driverName, setDriverName] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSearchedCPF = useRef<string>('');

    // Aplicar máscara de CPF
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const cleaned = cleanCPF(rawValue);

        // Limitar a 11 dígitos
        if (cleaned.length > 11) return;

        // Aplicar máscara
        const formatted = formatCPF(cleaned);
        onChange(formatted);
    };

    // Buscar motorista com debounce
    const searchDriver = useCallback(async (cpf: string) => {
        const cleaned = cleanCPF(cpf);

        // Não buscar se CPF inválido ou já buscou o mesmo
        if (!isValidCPF(cleaned) || cleaned === lastSearchedCPF.current) {
            return;
        }

        lastSearchedCPF.current = cleaned;
        setStatus('searching');
        setDriverName(null);

        try {
            const driver = await searchDriverByCPF(cpf);

            if (driver) {
                setStatus('found');
                setDriverName(driver.nome);
                onDriverFound?.(driver);
            } else {
                setStatus('not_found');
                onDriverNotFound?.();
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                setStatus('offline');
                onError?.('SSW-HELPER não está disponível');
            } else {
                setStatus('error');
                onError?.(errorMessage);
            }
        }
    }, [onDriverFound, onDriverNotFound, onError]);

    // Efeito de debounce para auto-search
    useEffect(() => {
        if (!autoSearch) return;

        const cleaned = cleanCPF(value);

        // Limpar timer anterior
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Reset status se CPF incompleto
        if (cleaned.length < 11) {
            setStatus('idle');
            setDriverName(null);
            lastSearchedCPF.current = '';
            return;
        }

        // Aguardar debounce para buscar
        debounceRef.current = setTimeout(() => {
            searchDriver(value);
        }, debounceMs);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [value, autoSearch, debounceMs, searchDriver]);

    // Busca manual (clique no ícone)
    const handleManualSearch = () => {
        if (isValidCPF(value)) {
            lastSearchedCPF.current = ''; // Forçar nova busca
            searchDriver(value);
        }
    };

    // Estilos baseados no status
    const getStatusStyles = () => {
        switch (status) {
            case 'found':
                return 'border-emerald-500/50 focus-within:border-emerald-400';
            case 'not_found':
                return 'border-amber-500/50 focus-within:border-amber-400';
            case 'error':
            case 'offline':
                return 'border-red-500/50 focus-within:border-red-400';
            default:
                return 'border-white/10 focus-within:border-benfica-blue';
        }
    };

    // Ícone de status
    const StatusIcon = () => {
        switch (status) {
            case 'searching':
                return <Loader2 className="w-4 h-4 text-benfica-blue animate-spin" />;
            case 'found':
                return <CheckCircle className="w-4 h-4 text-emerald-400" />;
            case 'not_found':
                return <AlertCircle className="w-4 h-4 text-amber-400" />;
            case 'error':
            case 'offline':
                return <XCircle className="w-4 h-4 text-red-400" />;
            default:
                return (
                    <button
                        type="button"
                        onClick={handleManualSearch}
                        disabled={!isValidCPF(value) || disabled}
                        className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                    >
                        <Search className="w-4 h-4 text-slate-400" />
                    </button>
                );
        }
    };

    // Mensagem de status
    const getStatusMessage = () => {
        switch (status) {
            case 'searching':
                return 'Buscando no SSW...';
            case 'found':
                return driverName ? `✓ ${driverName}` : 'Motorista encontrado';
            case 'not_found':
                return 'Motorista não encontrado no SSW';
            case 'offline':
                return 'SSW-HELPER offline';
            case 'error':
                return 'Erro na busca';
            default:
                return null;
        }
    };

    const statusMessage = getStatusMessage();

    return (
        <div className={`space-y-1 ${className}`}>
            {/* Label */}
            {label && (
                <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {label}
                    {required && <span className="text-red-400">*</span>}
                </label>
            )}

            {/* Input Container */}
            <div className={`
        relative flex items-center gap-2
        bg-white/5 border rounded-lg px-3 py-2
        transition-all duration-200
        ${getStatusStyles()}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}>
                <input
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    maxLength={14}
                    className="
            flex-1 bg-transparent text-white placeholder-slate-500
            focus:outline-none font-mono tracking-wide
          "
                />
                <StatusIcon />
            </div>

            {/* Status Message */}
            {statusMessage && (
                <p className={`text-xs flex items-center gap-1 ${status === 'found' ? 'text-emerald-400' :
                    status === 'not_found' ? 'text-amber-400' :
                        status === 'error' || status === 'offline' ? 'text-red-400' :
                            'text-slate-400'
                    }`}>
                    {statusMessage}
                </p>
            )}
        </div>
    );
}

export default CPFSearchInput;
