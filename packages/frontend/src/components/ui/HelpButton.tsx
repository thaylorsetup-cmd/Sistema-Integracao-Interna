import * as React from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '../../utils/classnames';
import { HelpTicketModal } from './HelpTicketModal';

export interface HelpButtonProps {
    className?: string;
}

/**
 * Botão de ajuda flutuante
 * Fica fixo no canto inferior direito e abre modal de ticket
 */
export function HelpButton({ className }: HelpButtonProps) {
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className={cn(
                    // Posicionamento fixo (Mobile: acima do menu / Desktop: canto inferior)
                    'fixed right-6 z-40 bottom-24 lg:bottom-6',
                    // Tamanho e formato
                    'w-14 h-14 rounded-full',
                    // Background com glassmorphism
                    'bg-gradient-to-br from-cyan-500 to-blue-600',
                    'shadow-lg shadow-cyan-500/30',
                    // Efeitos
                    'hover:scale-110 hover:shadow-xl hover:shadow-cyan-500/40',
                    'active:scale-95',
                    'transition-all duration-300 ease-out',
                    // Ícone
                    'flex items-center justify-center',
                    'text-white',
                    // Animação de pulse
                    'animate-pulse hover:animate-none',
                    className
                )}
                aria-label="Abrir ajuda"
            >
                <HelpCircle className="w-7 h-7" />
            </button>

            <HelpTicketModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
            />
        </>
    );
}
