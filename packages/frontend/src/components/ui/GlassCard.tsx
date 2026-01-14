import * as React from 'react';
import { cn } from '../../utils/classnames';

/**
 * GlassCard Component - BBT "Midnight Glass" Design System
 * 
 * Based on the legacy SaaS BBT TRUE design:
 * - bg-slate-950/40 (dark with 40% opacity)
 * - backdrop-blur-xl (intense blur)
 * - border border-white/10 (subtle glass edge)
 * - shadow-2xl (deep shadow for depth)
 */

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'dark' | 'alert' | 'success';
    glow?: boolean;
    animate?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, variant = 'default', glow = false, animate = true, ...props }, ref) => {
        const variants = {
            default: 'bg-white/60 backdrop-blur-xl border-white/30 hover:bg-white/70',
            dark: 'bg-slate-950/40 backdrop-blur-xl border-white/10 hover:bg-slate-950/50 hover:border-white/20',
            alert: 'bg-benfica-red/5 backdrop-blur-xl border-benfica-red/20 hover:bg-benfica-red/10',
            success: 'bg-emerald-500/5 backdrop-blur-xl border-emerald-500/20 hover:bg-emerald-500/10',
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-2xl border p-6 shadow-2xl',
                    animate && 'transition-all duration-300',
                    glow && 'shadow-lg shadow-benfica-blue/20',
                    variants[variant],
                    className
                )}
                {...props}
            />
        );
    }
);

GlassCard.displayName = 'GlassCard';

/**
 * GlassPanel Component - For sidebars and large panels
 */
export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    position?: 'left' | 'right';
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
    ({ className, position = 'left', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'bg-slate-950/60 backdrop-blur-2xl shadow-2xl',
                    position === 'left' && 'border-r border-white/10',
                    position === 'right' && 'border-l border-white/10',
                    className
                )}
                {...props}
            />
        );
    }
);

GlassPanel.displayName = 'GlassPanel';

/**
 * AnimatedBackground Component - Video-like animated gradient background
 * Provides the "Centro de Comando" aesthetic from legacy design
 */
export interface AnimatedBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'light' | 'dark' | 'midnight';
    showGrid?: boolean;
    showOrbs?: boolean;
}

const AnimatedBackground = React.forwardRef<HTMLDivElement, AnimatedBackgroundProps>(
    ({ className, variant = 'light', showGrid = true, showOrbs = true, children, ...props }, ref) => {
        const backgrounds = {
            light: 'bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30',
            dark: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
            midnight: 'bg-gradient-to-br from-slate-950 via-benfica-dark to-slate-900',
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'relative min-h-screen w-full overflow-hidden',
                    backgrounds[variant],
                    className
                )}
                {...props}
            >
                {/* Animated Orbs (like video background effect) */}
                {showOrbs && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {variant === 'light' ? (
                            <>
                                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                                <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
                            </>
                        ) : (
                            <>
                                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-benfica-blue/20 rounded-full blur-3xl animate-pulse" />
                                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-benfica-red/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                                <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
                            </>
                        )}
                    </div>
                )}

                {/* Optional Grid Pattern */}
                {showGrid && variant !== 'light' && (
                    <div
                        className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px',
                        }}
                    />
                )}

                {/* Content with z-index above background */}
                <div className="relative z-10">
                    {children}
                </div>
            </div>
        );
    }
);

AnimatedBackground.displayName = 'AnimatedBackground';

/**
 * StatusIndicator Component - Pulsing status dots like fleet tracking
 */
export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
    status: 'active' | 'idle' | 'delayed' | 'online' | 'offline';
    size?: 'sm' | 'md' | 'lg';
    showPulse?: boolean;
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
    ({ className, status, size = 'md', showPulse = true, ...props }, ref) => {
        const colors = {
            active: 'bg-emerald-500',
            idle: 'bg-blue-500',
            delayed: 'bg-benfica-red',
            online: 'bg-emerald-500',
            offline: 'bg-slate-400',
        };

        const sizes = {
            sm: 'w-2 h-2',
            md: 'w-3 h-3',
            lg: 'w-4 h-4',
        };

        return (
            <div
                ref={ref}
                className={cn('relative', className)}
                {...props}
            >
                {showPulse && (status === 'active' || status === 'online') && (
                    <span className={cn(
                        'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                        colors[status]
                    )} />
                )}
                <span className={cn(
                    'relative inline-flex rounded-full',
                    colors[status],
                    sizes[size]
                )} />
            </div>
        );
    }
);

StatusIndicator.displayName = 'StatusIndicator';

export { GlassCard, GlassPanel, AnimatedBackground, StatusIndicator };
