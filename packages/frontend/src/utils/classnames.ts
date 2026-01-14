import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clsx e tailwind-merge para um controle de classes mais efetivo
 * @example
 * cn("px-2 py-1", "px-4") // "py-1 px-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
