import * as React from 'react';
import { cn } from '../../utils/classnames';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      variant = 'primary',
      size = 'md',
      showLabel = false,
      label,
      animated = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const variants = {
      default: 'bg-gray-600',
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-danger',
    };

    const sizes = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    };

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {(showLabel || label) && (
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {label || 'Progress'}
            </span>
            {showLabel && (
              <span className="text-sm font-medium text-gray-700">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-full bg-gray-200',
            sizes[size]
          )}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-in-out',
              variants[variant],
              animated && 'animate-pulse'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export interface ProgressCircularProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
}

const ProgressCircular = React.forwardRef<HTMLDivElement, ProgressCircularProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      size = 120,
      strokeWidth = 8,
      variant = 'primary',
      showLabel = true,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const variants = {
      default: 'stroke-gray-600',
      primary: 'stroke-primary',
      success: 'stroke-success',
      warning: 'stroke-warning',
      danger: 'stroke-danger',
    };

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg
          className="-rotate-90 transform"
          width={size}
          height={size}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <circle
            className="stroke-gray-200"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={cn('transition-all duration-300 ease-in-out', variants[variant])}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        {showLabel && (
          <span className="absolute text-lg font-semibold text-gray-700">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }
);

ProgressCircular.displayName = 'ProgressCircular';

export { Progress, ProgressCircular };
