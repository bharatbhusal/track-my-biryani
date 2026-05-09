import { formatDateTime } from '@/lib/datetime';

export function formatCurrency(value: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: Date | string, locale = 'en-US', timeZone?: string): string {
  return formatDateTime(date, locale, timeZone);
}
