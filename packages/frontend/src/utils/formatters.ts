import { format, formatDistance, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data para o padrão brasileiro
 * @example
 * formatDate(new Date()) // "25/12/2025"
 */
export function formatDate(date: Date | string, pattern = 'dd/MM/yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return '-';
    return format(dateObj, pattern, { locale: ptBR });
  } catch {
    return '-';
  }
}

/**
 * Formata uma data para exibição relativa
 * @example
 * formatDistanceDate(new Date()) // "há alguns segundos"
 */
export function formatDistanceDate(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return '-';
    return formatDistance(dateObj, new Date(), { locale: ptBR, addSuffix: true });
  } catch {
    return '-';
  }
}

/**
 * Formata um valor monetário em real
 * @example
 * formatCurrency(1500) // "R$ 1.500,00"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata um número com separadores
 * @example
 * formatNumber(1500.5) // "1.500,5"
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formata um percentual
 * @example
 * formatPercent(0.85) // "85%"
 */
export function formatPercent(value: number, decimals = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
