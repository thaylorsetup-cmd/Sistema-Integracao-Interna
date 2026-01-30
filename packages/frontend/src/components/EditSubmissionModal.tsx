import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, FileText } from 'lucide-react';
import { filaApi } from '@/services/api';

interface EditSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    submission: any; // Aceita ViagemItem ou Submission
    onSuccess: () => void;
}

export function EditSubmissionModal({ isOpen, onClose, submission, onSuccess }: EditSubmissionModalProps) {
    const [formData, setFormData] = useState({
        origem: '',
        destino: '',
        valorMercadoria: '',
        tipoMercadoria: '',
        telMotorista: '',
        telProprietario: '',
        numeroPis: '',
        enderecoResidencial: '',
        referenciaComercial1: '',
        referenciaComercial2: '',
        referenciaPessoal1: '',
        referenciaPessoal2: '',
        referenciaPessoal3: '',
        // Dados básicos para correção também
        nomeMotorista: '',
        cpf: '',
        placa: '',
        tipoVeiculo: '',
        telefone: '', // Telefone geral
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (submission) {
            setFormData({
                origem: submission.origem || '',
                destino: submission.destino || '',
                valorMercadoria: submission.valorMercadoria || '',
                tipoMercadoria: submission.tipoMercadoria || '',
                telMotorista: submission.telMotorista || '',
                telProprietario: submission.telProprietario || '',
                numeroPis: submission.numeroPis || '',
                enderecoResidencial: submission.enderecoResidencial || '',
                referenciaComercial1: submission.referenciaComercial1 || '',
                referenciaComercial2: submission.referenciaComercial2 || '',
                referenciaPessoal1: submission.referenciaPessoal1 || '',
                referenciaPessoal2: submission.referenciaPessoal2 || '',
                referenciaPessoal3: submission.referenciaPessoal3 || '',
                nomeMotorista: submission.nomeMotorista || '',
                cpf: submission.cpf || '',
                placa: submission.placa || '',
                tipoVeiculo: submission.tipoVeiculo || '',
                telefone: submission.telefone || '', // Usando telefone geral se existir
            });
        }
    }, [submission]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const updateData = {
                ...formData,
                valorMercadoria: formData.valorMercadoria ? parseFloat(formData.valorMercadoria.toString()) : undefined,
            };

            const response = await filaApi.update(submission.id, updateData);

            if (response.success) {
                onSuccess();
                onClose();
            } else {
                setError(response.error || 'Erro ao atualizar cadastro');
            }
        } catch (err: any) {
            setError('Erro de conexão ao salvar alterações');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl p-4 border-b border-white/10 flex items-center justify-between z-10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-benfica-blue" />
                        Editar Cadastro Devolvido
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Dados Básicos */}
                        <div className="col-span-full border-b border-white/10 pb-2 mb-2">
                            <h3 className="text-sm font-semibold text-benfica-blue mb-4">Dados Básicos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Nome Motorista</label>
                                    <input
                                        type="text"
                                        name="nomeMotorista"
                                        value={formData.nomeMotorista}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">CPF</label>
                                    <input
                                        type="text"
                                        name="cpf"
                                        value={formData.cpf}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Placa</label>
                                    <input
                                        type="text"
                                        name="placa"
                                        value={formData.placa}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Origem e Destino */}
                        <h3 className="col-span-full text-sm font-semibold text-benfica-blue mt-2">Viagem</h3>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Origem</label>
                            <input
                                type="text"
                                name="origem"
                                value={formData.origem}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Destino</label>
                            <input
                                type="text"
                                name="destino"
                                value={formData.destino}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                            />
                        </div>

                        {/* Mercadoria */}
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Valor (R$)</label>
                            <input
                                type="number"
                                name="valorMercadoria"
                                value={formData.valorMercadoria}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Tipo Mercadoria</label>
                            <input
                                type="text"
                                name="tipoMercadoria"
                                value={formData.tipoMercadoria}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                            />
                        </div>

                        {/* Telefones */}
                        <h3 className="col-span-full text-sm font-semibold text-benfica-blue mt-2">Contatos</h3>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Tel. Motorista</label>
                            <input
                                type="tel"
                                name="telMotorista"
                                value={formData.telMotorista}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Tel. Proprietário</label>
                            <input
                                type="tel"
                                name="telProprietario"
                                value={formData.telProprietario}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Número PIS</label>
                            <input
                                type="text"
                                name="numeroPis"
                                value={formData.numeroPis}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                            />
                        </div>

                        {/* Endereço */}
                        <div className="col-span-full">
                            <label className="block text-xs text-slate-400 mb-1">Endereço Residencial</label>
                            <input
                                type="text"
                                name="enderecoResidencial"
                                value={formData.enderecoResidencial}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                            />
                        </div>

                        {/* Referencias */}
                        <h3 className="col-span-full text-sm font-semibold text-benfica-blue mt-2">Referências</h3>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Ref. Comercial 1</label>
                            <input
                                type="text"
                                name="referenciaComercial1"
                                value={formData.referenciaComercial1}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Ref. Comercial 2</label>
                            <input
                                type="text"
                                name="referenciaComercial2"
                                value={formData.referenciaComercial2}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Ref. Pessoal 1</label>
                            <input
                                type="text"
                                name="referenciaPessoal1"
                                value={formData.referenciaPessoal1}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Ref. Pessoal 2</label>
                            <input
                                type="text"
                                name="referenciaPessoal2"
                                value={formData.referenciaPessoal2}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Ref. Pessoal 3</label>
                            <input
                                type="text"
                                name="referenciaPessoal3"
                                value={formData.referenciaPessoal3}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-benfica-blue focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2 bg-benfica-blue text-white font-bold rounded-lg hover:bg-benfica-blue/90 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
