/**
 * TipoCadastroSelector - Seletor de tipo de cadastro
 * Permite ao operador escolher entre os 4 tipos de cadastro disponíveis
 */
import { useState } from 'react';
import {
    UserPlus,
    RefreshCw,
    Users,
    Truck,
    ChevronRight,
    FileText,
    CheckCircle2,
    Info
} from 'lucide-react';
import { cn } from '@/utils/classnames';
import { TIPOS_CADASTRO, type TipoCadastro } from '@/config/tipoCadastro';

interface TipoCadastroSelectorProps {
    value?: TipoCadastro;
    onChange: (tipo: TipoCadastro) => void;
    disabled?: boolean;
}

const ICONS: Record<TipoCadastro, React.ElementType> = {
    novo_cadastro: UserPlus,
    atualizacao: RefreshCw,
    agregado: Users,
    bens_rodando: Truck,
};

const COLORS: Record<TipoCadastro, { bg: string; border: string; icon: string; text: string }> = {
    novo_cadastro: {
        bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
        border: 'border-emerald-500/30 hover:border-emerald-500/50',
        icon: 'text-emerald-400',
        text: 'text-emerald-400',
    },
    atualizacao: {
        bg: 'bg-blue-500/10 hover:bg-blue-500/20',
        border: 'border-blue-500/30 hover:border-blue-500/50',
        icon: 'text-blue-400',
        text: 'text-blue-400',
    },
    agregado: {
        bg: 'bg-purple-500/10 hover:bg-purple-500/20',
        border: 'border-purple-500/30 hover:border-purple-500/50',
        icon: 'text-purple-400',
        text: 'text-purple-400',
    },
    bens_rodando: {
        bg: 'bg-orange-500/10 hover:bg-orange-500/20',
        border: 'border-orange-500/30 hover:border-orange-500/50',
        icon: 'text-orange-400',
        text: 'text-orange-400',
    },
};

export function TipoCadastroSelector({
    value,
    onChange,
    disabled = false
}: TipoCadastroSelectorProps) {
    const [expandedTipo, setExpandedTipo] = useState<TipoCadastro | null>(null);

    const tiposOrdenados = Object.entries(TIPOS_CADASTRO) as [TipoCadastro, typeof TIPOS_CADASTRO[TipoCadastro]][];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white mb-2">
                    Selecione o Tipo de Cadastro
                </h2>
                <p className="text-slate-400 text-sm">
                    Escolha o tipo de cadastro adequado para a operação
                </p>
            </div>

            {/* Grid de Tipos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tiposOrdenados.map(([tipo, config]) => {
                    const Icon = ICONS[tipo];
                    const colors = COLORS[tipo];
                    const isSelected = value === tipo;
                    const isExpanded = expandedTipo === tipo;

                    return (
                        <div
                            key={tipo}
                            className={cn(
                                'relative rounded-xl border-2 p-5 transition-all duration-300 cursor-pointer',
                                colors.bg,
                                isSelected
                                    ? `${colors.border} ring-2 ring-offset-2 ring-offset-slate-900 ${colors.border.replace('border-', 'ring-')}`
                                    : colors.border,
                                disabled && 'opacity-50 cursor-not-allowed'
                            )}
                            onClick={() => !disabled && onChange(tipo)}
                            onMouseEnter={() => setExpandedTipo(tipo)}
                            onMouseLeave={() => setExpandedTipo(null)}
                        >
                            {/* Indicador de Selecionado */}
                            {isSelected && (
                                <div className="absolute top-3 right-3">
                                    <CheckCircle2 className={cn('w-6 h-6', colors.icon)} />
                                </div>
                            )}

                            {/* Header do Card */}
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    'p-3 rounded-xl',
                                    isSelected ? colors.bg.replace('/10', '/30') : colors.bg
                                )}>
                                    <Icon className={cn('w-6 h-6', colors.icon)} />
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white mb-1">
                                        {config.label}
                                    </h3>
                                    <p className="text-sm text-slate-400">
                                        {config.descricao}
                                    </p>
                                </div>
                            </div>

                            {/* Detalhes Expandidos */}
                            <div className={cn(
                                'overflow-hidden transition-all duration-300',
                                isExpanded ? 'max-h-48 mt-4 opacity-100' : 'max-h-0 opacity-0'
                            )}>
                                <div className="border-t border-white/10 pt-4 space-y-3">
                                    {/* Documentos Obrigatórios */}
                                    <div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
                                            <FileText className="w-3.5 h-3.5" />
                                            Documentos Obrigatórios
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {config.documentosObrigatorios.slice(0, 5).map((doc) => (
                                                <span
                                                    key={doc}
                                                    className="px-2 py-0.5 bg-white/10 text-xs text-slate-300 rounded"
                                                >
                                                    {doc.toUpperCase()}
                                                </span>
                                            ))}
                                            {config.documentosObrigatorios.length > 5 && (
                                                <span className="px-2 py-0.5 bg-white/10 text-xs text-slate-400 rounded">
                                                    +{config.documentosObrigatorios.length - 5}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rastreamento */}
                                    {config.requerRastreamento && (
                                        <div className="flex items-center gap-2 text-xs text-amber-400">
                                            <Info className="w-3.5 h-3.5" />
                                            Requer rastreamento para valores acima de R$ 500.000
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Seta de Ação */}
                            <div className={cn(
                                'absolute bottom-4 right-4 transition-transform duration-300',
                                isExpanded ? 'translate-x-1' : ''
                            )}>
                                <ChevronRight className={cn(
                                    'w-5 h-5',
                                    isSelected ? colors.icon : 'text-slate-500'
                                )} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legenda */}
            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/50" />
                    <span>Novo</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500/30 border border-blue-500/50" />
                    <span>Atualização</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500/30 border border-purple-500/50" />
                    <span>Agregado</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500/30 border border-orange-500/50" />
                    <span>Bens Rodando</span>
                </div>
            </div>
        </div>
    );
}

export default TipoCadastroSelector;
