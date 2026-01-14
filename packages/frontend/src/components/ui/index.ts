/**
 * Componentes UI base inspirados em shadcn/ui
 * Todos os componentes utilizam Tailwind CSS e o tema BBT
 */

// Avatar
export { Avatar, AvatarGroup } from './Avatar';
export type { AvatarProps, AvatarGroupProps } from './Avatar';

// Badge
export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

// Button
export { Button } from './Button';
export type { ButtonProps } from './Button';

// Card
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
} from './Card';

// CardPro - Professional cards with glassmorphism
export { CardPro, StatCardPro } from './CardPro';

// Dialog
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './Dialog';
export type {
  DialogProps,
  DialogContentProps,
  DialogHeaderProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogFooterProps,
} from './Dialog';

// Input
export { Input } from './Input';
export type { InputProps } from './Input';

// InputPro - Professional input with masks and validation
export { InputPro } from './InputPro';

// Loading
export { Loading, LoadingSmall } from './Loading';

// Progress
export { Progress, ProgressCircular } from './Progress';
export type { ProgressProps, ProgressCircularProps } from './Progress';

// Select
export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

// Separator
export { Separator } from './Separator';
export type { SeparatorProps } from './Separator';

// Skeleton
export { Skeleton, SkeletonText, SkeletonCard } from './Skeleton';
export type { SkeletonProps, SkeletonTextProps, SkeletonCardProps } from './Skeleton';

// Textarea
export { Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';

// Toast
export { ToastProvider, useToast } from './Toast';
export type { Toast, ToastProviderProps } from './Toast';

// GlassCard (BBT Legacy Design System)
export { GlassCard, GlassPanel, AnimatedBackground, StatusIndicator } from './GlassCard';
export type { GlassCardProps, GlassPanelProps, AnimatedBackgroundProps, StatusIndicatorProps } from './GlassCard';

// Video/SVG Animated Background
export { AnimatedBackground as SVGAnimatedBackground, VideoBackground } from './AnimatedBackground';
