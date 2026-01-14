/**
 * DriverInfoCard - Card para exibir dados do motorista do SSW
 * 
 * Exibe informações do motorista retornadas pela API SSW-HELPER
 * com indicadores visuais de status (CNH válida, situação, etc.)
 */

import {
    User,
    Phone,
    MapPin,
    CreditCard,
    CheckCircle,
    XCircle,
    AlertCircle,
    Truck,
    Clock,
    Shield
} from 'lucide-react';
import type { DriverData } from '@/types/ssw.types';

interface DriverInfoCardProps {
    driver: DriverData;
    compact?: boolean;
    className?: string;
    showVehicles?: boolean;
}

// Badge de situação
function SituacaoBadge({ situacao }: { situacao: DriverData['situacao'] }) {
    const styles = {
        ativo: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        inativo: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        pendente: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        bloqueado: 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    const icons = {
        ativo: CheckCircle,
        inativo: XCircle,
        pendente: Clock,
        bloqueado: AlertCircle
    };

    const labels = {
        ativo: 'Ativo',
        inativo: 'Inativo',
        pendente: 'Pendente',
        bloqueado: 'Bloqueado'
    };

    const Icon = icons[situacao];

    return (
        <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 
      text-xs font-bold rounded-lg border
      ${styles[situacao]}
    `}>
            <Icon className="w-3 h-3" />
            {labels[situacao]}
        </span>
    );
}

// Badge de CNH
function CNHBadge({ valida, vencimento }: { valida?: boolean; vencimento?: string }) {
    if (valida === undefined) return null;

    return (
        <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 
      text-xs font-bold rounded-lg border
      ${valida
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/30'
            }
    `}>
            <CreditCard className="w-3 h-3" />
            CNH {valida ? 'Válida' : 'Vencida'}
            {vencimento && <span className="opacity-70">({vencimento})</span>}
        </span>
    );
}

export function DriverInfoCard({
    driver,
    compact = false,
    className = '',
    showVehicles = true
}: DriverInfoCardProps) {
    if (compact) {
        // Versão compacta para uso inline
        return (
            <div className={`
        flex items-center gap-3 p-3 
        bg-white/5 backdrop-blur-lg rounded-xl 
        border border-white/10
        ${className}
      `}>
                <div className="p-2 bg-benfica-blue/20 rounded-lg">
                    <User className="w-5 h-5 text-benfica-blue" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{driver.nome}</p>
                    <p className="text-xs text-slate-400">{driver.cpf}</p>
                </div>
                <SituacaoBadge situacao={driver.situacao} />
            </div>
        );
    }

    // Versão completa
    return (
        <div className={`
      bg-white/5 backdrop-blur-lg rounded-2xl 
      border border-white/10 overflow-hidden
      ${className}
    `}>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-benfica-blue/20 rounded-xl">
                        <Shield className="w-6 h-6 text-benfica-blue" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-400">Dados do SSW</h3>
                        <p className="text-xs text-slate-500">
                            Atualizado em {driver.ultimaAtualizacao
                                ? new Date(driver.ultimaAtualizacao).toLocaleString('pt-BR')
                                : 'agora'
                            }
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <SituacaoBadge situacao={driver.situacao} />
                    <CNHBadge valida={driver.cnhValida} vencimento={driver.vencimentoCNH} />
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Dados Pessoais */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                            <User className="w-3 h-3" />
                            <span>Nome Completo</span>
                        </div>
                        <p className="text-white font-medium">{driver.nome}</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                            <CreditCard className="w-3 h-3" />
                            <span>CPF</span>
                        </div>
                        <p className="text-white font-mono">{driver.cpf}</p>
                    </div>

                    {driver.telefone && (
                        <div className="bg-white/5 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <Phone className="w-3 h-3" />
                                <span>Telefone</span>
                            </div>
                            <p className="text-white">{driver.telefone}</p>
                        </div>
                    )}

                    {(driver.cidade || driver.uf) && (
                        <div className="bg-white/5 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <MapPin className="w-3 h-3" />
                                <span>Localidade</span>
                            </div>
                            <p className="text-white">
                                {[driver.cidade, driver.uf].filter(Boolean).join(' - ')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Dados da CNH */}
                {(driver.numeroCNH || driver.categoriaCNH || driver.vencimentoCNH) && (
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            Carteira Nacional de Habilitação
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            {driver.numeroCNH && (
                                <div className="bg-white/5 rounded-lg p-2.5">
                                    <p className="text-xs text-slate-500">Número</p>
                                    <p className="text-sm text-white font-mono">{driver.numeroCNH}</p>
                                </div>
                            )}
                            {driver.categoriaCNH && (
                                <div className="bg-white/5 rounded-lg p-2.5">
                                    <p className="text-xs text-slate-500">Categoria</p>
                                    <p className="text-sm text-white font-bold">{driver.categoriaCNH}</p>
                                </div>
                            )}
                            {driver.vencimentoCNH && (
                                <div className="bg-white/5 rounded-lg p-2.5">
                                    <p className="text-xs text-slate-500">Vencimento</p>
                                    <p className={`text-sm font-medium ${driver.cnhValida ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                        {driver.vencimentoCNH}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Veículos Associados */}
                {showVehicles && driver.veiculosAssociados && driver.veiculosAssociados.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            Veículos Associados ({driver.veiculosAssociados.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {driver.veiculosAssociados.map((vehicle, idx) => (
                                <div
                                    key={idx}
                                    className={`
                    px-3 py-1.5 rounded-lg text-xs font-mono
                    ${vehicle.situacao === 'ativo'
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                        }
                  `}
                                >
                                    <Truck className="w-3 h-3 inline mr-1" />
                                    {vehicle.placa}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DriverInfoCard;
