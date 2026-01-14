import * as React from 'react';
import { cn } from '../../utils/classnames';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variants = {
      default:
        'bg-slate-100 text-slate-700 border-slate-200/60',
      secondary:
        'bg-slate-50 text-slate-600 border-slate-200/40',
      success:
        'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200/60 shadow-sm shadow-green-500/10',
      warning:
        'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200/60 shadow-sm shadow-amber-500/10',
      danger:
        'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200/60 shadow-sm shadow-red-500/10',
      info:
        'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200/60 shadow-sm shadow-blue-500/10',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-xs',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border font-semibold transition-all duration-200',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
