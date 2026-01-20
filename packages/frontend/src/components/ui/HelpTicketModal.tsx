import * as React from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { cn } from '../../utils/classnames';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from './Dialog';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select } from './Select';
import { useToast } from './Toast';
import { ticketApi } from '../../services/api';

export interface HelpTicketModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const categorias = [
    { value: 'bug', label: '🐛 Bug / Erro' },
    { value: 'duvida', label: '❓ Dúvida' },
    { value: 'sugestao', label: '💡 Sugestão' },
    { value: 'outro', label: '📝 Outro' },
];

/**
 * Modal para envio de ticket de suporte
 */
export function HelpTicketModal({ open, onOpenChange }: HelpTicketModalProps) {
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formData, setFormData] = React.useState({
        titulo: '',
        categoria: 'duvida' as 'bug' | 'duvida' | 'sugestao' | 'outro',
        descricao: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.titulo.trim()) {
            addToast({
                type: 'error',
                title: 'Erro',
                message: 'Por favor, informe um título para o ticket',
            });
            return;
        }

        if (!formData.descricao.trim()) {
            addToast({
                type: 'error',
                title: 'Erro',
                message: 'Por favor, descreva seu problema ou sugestão',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await ticketApi.create({
                titulo: formData.titulo,
                categoria: formData.categoria,
                descricao: formData.descricao,
            });

            addToast({
                type: 'success',
                title: 'Ticket enviado!',
                message: 'Sua solicitação foi recebida. Entraremos em contato em breve.',
            });

            // Reset form
            setFormData({ titulo: '', categoria: 'duvida', descricao: '' });
            onOpenChange(false);
        } catch (error) {
            console.error('Erro ao enviar ticket:', error);
            addToast({
                type: 'error',
                title: 'Erro ao enviar',
                message: 'Não foi possível enviar o ticket. Tente novamente.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="max-w-md"
                onClose={handleClose}
            >
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <DialogTitle>Central de Ajuda</DialogTitle>
                    </div>
                    <DialogDescription>
                        Descreva seu problema, dúvida ou sugestão. Nossa equipe irá analisar e responder em breve.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                            Título *
                        </label>
                        <Input
                            placeholder="Resumo do seu ticket"
                            value={formData.titulo}
                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                            Categoria *
                        </label>
                        <Select
                            options={categorias}
                            value={formData.categoria}
                            onChange={(value) => setFormData({ ...formData, categoria: value as typeof formData.categoria })}
                            placeholder="Selecione uma categoria"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                            Descrição *
                        </label>
                        <Textarea
                            placeholder="Descreva detalhadamente o que você precisa..."
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                            rows={4}
                            disabled={isSubmitting}
                            className="resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className={cn(
                                'bg-gradient-to-r from-cyan-500 to-blue-600 text-white',
                                'hover:from-cyan-600 hover:to-blue-700',
                                'border-0'
                            )}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Enviar Ticket
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
