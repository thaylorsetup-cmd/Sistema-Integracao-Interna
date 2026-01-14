import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

interface CardProProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'glass' | 'glow';
    glowColor?: 'red' | 'blue' | 'green' | 'neon';
    noPadding?: boolean;
    hover?: boolean;
}

export const CardPro = forwardRef<HTMLDivElement, CardProProps>(
    ({
        className = '',
        variant = 'default',
        glowColor,
        noPadding = false,
        hover = true,
        children,
        ...props
    }, ref) => {
        const baseStyles = 'rounded-2xl transition-all duration-300 overflow-hidden';

        const variants = {
            default: 'bg-midnight-elevated border border-white/10',
            elevated: 'bg-midnight-elevated border border-white/10 shadow-lg shadow-black/20',
            glass: 'glass-control-tower',
            glow: 'bg-midnight-elevated border border-white/10',
        };

        const glowStyles = {
            red: 'shadow-glow-red',
            blue: 'shadow-glow-blue',
            green: 'shadow-glow-green',
            neon: 'shadow-glow-neon',
        };

        const hoverStyles = hover
            ? 'hover:border-white/20 hover:-translate-y-1 hover:shadow-xl cursor-pointer'
            : '';

        const paddingStyles = noPadding ? '' : 'p-5';

        return (
            <div
                ref={ref}
                className={`
          ${baseStyles}
          ${variants[variant]}
          ${glowColor ? glowStyles[glowColor] : ''}
          ${hoverStyles}
          ${paddingStyles}
          ${className}
        `}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardPro.displayName = 'CardPro';

// Stat Card for KPIs
interface StatCardProProps extends HTMLAttributes<HTMLDivElement> {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'red' | 'blue' | 'green' | 'neon' | 'purple';
}

export const StatCardPro = forwardRef<HTMLDivElement, StatCardProProps>(
    ({
        title,
        value,
        subtitle,
        icon,
        trend,
        color = 'neon',
        className = '',
        ...props
    }, ref) => {
        const colorStyles = {
            red: {
                iconBg: 'bg-red-500/20',
                iconText: 'text-red-400',
                valueBg: 'bg-gradient-to-r from-red-400 to-red-300',
                glow: 'shadow-red-500/20',
            },
            blue: {
                iconBg: 'bg-benfica-blue/20',
                iconText: 'text-benfica-blue',
                valueBg: 'bg-gradient-to-r from-benfica-blue to-blue-400',
                glow: 'shadow-benfica-blue/20',
            },
            green: {
                iconBg: 'bg-emerald-500/20',
                iconText: 'text-emerald-400',
                valueBg: 'bg-gradient-to-r from-emerald-400 to-green-300',
                glow: 'shadow-emerald-500/20',
            },
            neon: {
                iconBg: 'bg-neon-turquoise/20',
                iconText: 'text-neon-turquoise',
                valueBg: 'bg-gradient-to-r from-neon-turquoise to-cyan-300',
                glow: 'shadow-neon-turquoise/20',
            },
            purple: {
                iconBg: 'bg-purple-500/20',
                iconText: 'text-purple-400',
                valueBg: 'bg-gradient-to-r from-purple-400 to-violet-300',
                glow: 'shadow-purple-500/20',
            },
        };

        const styles = colorStyles[color];

        return (
            <div
                ref={ref}
                className={`
          card-pro p-5 relative overflow-hidden
          hover:border-white/20 hover:-translate-y-1 hover:shadow-xl
          ${className}
        `}
                {...props}
            >
                {/* Background glow effect */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 ${styles.iconBg} rounded-full blur-3xl opacity-50`}></div>

                <div className="relative flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm text-text-secondary font-medium mb-1">{title}</p>
                        <p className={`text-3xl font-black ${styles.valueBg} bg-clip-text text-transparent data-dense`}>
                            {value}
                        </p>
                        {subtitle && (
                            <p className="text-xs text-text-muted mt-1">{subtitle}</p>
                        )}
                        {trend && (
                            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                <span>{trend.isPositive ? '↑' : '↓'}</span>
                                <span>{Math.abs(trend.value)}%</span>
                                <span className="text-text-muted">vs. ontem</span>
                            </div>
                        )}
                    </div>
                    {icon && (
                        <div className={`p-3 rounded-xl ${styles.iconBg} ${styles.iconText}`}>
                            {icon}
                        </div>
                    )}
                </div>
            </div>
        );
    }
);

StatCardPro.displayName = 'StatCardPro';
