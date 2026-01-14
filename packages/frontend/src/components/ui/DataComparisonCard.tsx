/**
 * DataComparisonCard - Comparação de dados enviados vs dados do SSW
 * 
 * Usado no Dashboard Cadastro GR para destacar discrepâncias
 * entre os dados informados pelo operador e os dados do sistema SSW
 */

import {
    CheckCircle,
    AlertTriangle,
    ArrowRight,
    User,
    Phone,
    FileText
} from 'lucide-react';
import type { DriverData, DataComparison } from '@/types/ssw.types';

interface SubmittedData {
    motorista: string;
    cpfMotorista: string;
    telefone?: string;
}

interface DataComparisonCardProps {
    submitted: SubmittedData;
    sswData: DriverData;
    className?: string;
}

// Normalizar texto para comparação
function normalizeText(text?: string): string {
    if (!text) return '';
    return text
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s]/g, ''); // Remove caracteres especiais
}

// Comparar strings com tolerância
function compareStrings(a?: string, b?: string): boolean {
    const normA = normalizeText(a);
    const normB = normalizeText(b);

    if (!normA || !normB) return true; // Ignorar campos vazios

    // Comparação exata
    if (normA === normB) return true;

    // Comparação parcial (nome pode ser abreviado)
    if (normA.includes(normB) || normB.includes(normA)) return true;

    return false;
}

// Gerar comparações
function generateComparisons(submitted: SubmittedData, ssw: DriverData): DataComparison[] {
    const comparisons: DataComparison[] = [
        {
            field: 'nome',
            label: 'Nome do Motorista',
            submittedValue: submitted.motorista,
            sswValue: ssw.nome,
            matches: compareStrings(submitted.motorista, ssw.nome)
        },
        {
            field: 'cpf',
            label: 'CPF',
            submittedValue: submitted.cpfMotorista,
            sswValue: ssw.cpf,
            matches: normalizeText(submitted.cpfMotorista) === normalizeText(ssw.cpf)
        }
    ];

    // Adicionar telefone se existir em ambos
    if (submitted.telefone || ssw.telefone) {
        comparisons.push({
            field: 'telefone',
            label: 'Telefone',
            submittedValue: submitted.telefone,
            sswValue: ssw.telefone,
            matches: compareStrings(submitted.telefone, ssw.telefone)
        });
    }

    return comparisons;
}

// Linha de comparação individual
function ComparisonRow({ comparison }: { comparison: DataComparison }) {
    const { label, submittedValue, sswValue, matches } = comparison;

    // Determinar ícone baseado no campo
    const FieldIcon = {
        nome: User,
        cpf: FileText,
        telefone: Phone
    }[comparison.field] || FileText;

    return (
        <div className={`
      p-3 rounded-xl border transition-all
      ${matches
                ? 'bg-white/5 border-white/10'
                : 'bg-red-500/10 border-red-500/30'
            }
    `}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                    <FieldIcon className="w-3 h-3" />
                    {label}
                </span>
                {matches ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
            </div>

            {/* Values */}
            <div className="flex items-center gap-2 text-sm">
                {/* Submitted Value */}
                <div className={`
          flex-1 px-2 py-1 rounded-lg
          ${matches ? 'bg-white/5' : 'bg-red-500/20'}
        `}>
                    <p className="text-xs text-slate-500 mb-0.5">Enviado</p>
                    <p className={`font-medium ${matches ? 'text-white' : 'text-red-300'}`}>
                        {submittedValue || '—'}
                    </p>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />

                {/* SSW Value */}
                <div className={`
          flex-1 px-2 py-1 rounded-lg
          ${matches ? 'bg-white/5' : 'bg-emerald-500/20'}
        `}>
                    <p className="text-xs text-slate-500 mb-0.5">SSW</p>
                    <p className={`font-medium ${matches ? 'text-white' : 'text-emerald-300'}`}>
                        {sswValue || '—'}
                    </p>
                </div>
            </div>
        </div>
    );
}

export function DataComparisonCard({
    submitted,
    sswData,
    className = ''
}: DataComparisonCardProps) {
    const comparisons = generateComparisons(submitted, sswData);
    const discrepancies = comparisons.filter(c => !c.matches);
    const hasDiscrepancies = discrepancies.length > 0;

    return (
        <div className={`
      bg-white/5 backdrop-blur-lg rounded-2xl 
      border overflow-hidden
      ${hasDiscrepancies ? 'border-red-500/30' : 'border-emerald-500/30'}
      ${className}
    `}>
            {/* Header */}
            <div className={`
        p-4 border-b flex items-center justify-between
        ${hasDiscrepancies
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-emerald-500/10 border-emerald-500/20'
                }
      `}>
                <div className="flex items-center gap-3">
                    {hasDiscrepancies ? (
                        <div className="p-2 bg-red-500/20 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                    ) : (
                        <div className="p-2 bg-emerald-500/20 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                    )}
                    <div>
                        <h3 className={`text-sm font-bold ${hasDiscrepancies ? 'text-red-400' : 'text-emerald-400'}`}>
                            {hasDiscrepancies
                                ? `${discrepancies.length} Discrepância${discrepancies.length > 1 ? 's' : ''} Encontrada${discrepancies.length > 1 ? 's' : ''}`
                                : 'Dados Conferem'
                            }
                        </h3>
                        <p className="text-xs text-slate-400">
                            Comparação: Dados Enviados × Sistema SSW
                        </p>
                    </div>
                </div>
            </div>

            {/* Comparisons */}
            <div className="p-4 space-y-3">
                {comparisons.map((comparison) => (
                    <ComparisonRow key={comparison.field} comparison={comparison} />
                ))}
            </div>

            {/* SSW Status */}
            <div className="px-4 pb-4">
                <div className={`
          p-3 rounded-xl flex items-center justify-between
          ${sswData.situacao === 'ativo'
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : sswData.situacao === 'bloqueado'
                            ? 'bg-red-500/10 border border-red-500/30'
                            : 'bg-amber-500/10 border border-amber-500/30'
                    }
        `}>
                    <span className="text-xs text-slate-400">Situação no SSW</span>
                    <span className={`
            text-sm font-bold uppercase
            ${sswData.situacao === 'ativo'
                            ? 'text-emerald-400'
                            : sswData.situacao === 'bloqueado'
                                ? 'text-red-400'
                                : 'text-amber-400'
                        }
          `}>
                        {sswData.situacao}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default DataComparisonCard;
