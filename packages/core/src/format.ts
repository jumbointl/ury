import { storage } from './storage';

/**
 * Locale derived from the site's Frappe number_format (stored by the POS as
 * 'numberFormat' when it reads the Currency doc). Upstream hardcoded 'en-IN'.
 */
const NUMBER_FORMAT_LOCALES: Record<string, string> = {
  '#,###.##': 'en-US',
  '#.###,##': 'de-DE',
  '# ###.##': 'en-ZA',
  '# ###,##': 'fr-FR',
  "#'###.##": 'de-CH',
  '#, ###.##': 'en-US',
  '#,##,###.##': 'en-IN',
  '#,###.###': 'en-US',
  '#.###': 'de-DE',
  '#,###': 'en-US',
};
export function localeFor(fmt?: string | null): string {
  return (fmt && NUMBER_FORMAT_LOCALES[fmt]) || numberLocale();
}
/** Monto en una moneda cualquiera (multimoneda): símbolo + decimales + formato propios. */
export function formatMoney(amount: number, symbol: string, decimals: number = 2, locale?: string): string {
  const rounded = flt(amount, decimals);
  const formatted = typeof rounded === 'number' && !isNaN(rounded)
    ? rounded.toLocaleString(locale || numberLocale(), { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : rounded;
  return `${symbol} ${formatted}`;
}
export function numberLocale(): string {
  const fmt = storage.getItem('numberFormat') || '';
  return NUMBER_FORMAT_LOCALES[fmt] || 'en-IN';
}
export function currencyDecimals(): number {
  const d = storage.getItem('currencyPrecision');
  if (d === null || d === '') return 2;
  const n = parseInt(d, 10);
  return isNaN(n) ? 2 : n;
}

export function formatCurrency(amount: number): string {
  const symbol = storage.getItem('currencySymbol') || '₹';
  const decimals = currencyDecimals();
  const roundedAmount = flt(amount, decimals);
  const formattedVal = typeof roundedAmount === 'number' && !isNaN(roundedAmount)
    ? roundedAmount.toLocaleString(numberLocale(), { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : roundedAmount;
  return `${symbol} ${formattedVal}`;
}

export function flt(v: number | string | null | undefined, decimals: number = 2): number {
  if (v == null || v === '') return 0;
  const num = typeof v === 'number' ? v : parseFloat(v as string);
  if (isNaN(num)) return 0;
  if (decimals != null) {
    const mult = Math.pow(10, decimals);
    const isNegative = num < 0;
    const absNum = Math.abs(num);
    const n = +(absNum * mult).toFixed(8);
    const rounded = Math.round(n) / mult;
    return isNegative ? -rounded : rounded;
  }
  return num;
}

/**
 * Formats a number as compact Indian-style currency for chart axes/labels,
 * e.g. 600000 -> "₹6L", 12500000 -> "₹1.25Cr", 8200 -> "₹8.2k".
 */
export function formatCompactCurrency(amount: number): string {
  const symbol = storage.getItem('currencySymbol') || '₹';
  if (typeof amount !== 'number' || isNaN(amount)) return `${symbol} ${amount}`;

  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);

  const trim = (value: number) => {
    const rounded = Math.round(value * 100) / 100;
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  };

  if (abs >= 1_00_00_000) return `${sign}${symbol}${trim(abs / 1_00_00_000)}Cr`;
  if (abs >= 1_00_000) return `${sign}${symbol}${trim(abs / 1_00_000)}L`;
  if (abs >= 1_000) return `${sign}${symbol}${trim(abs / 1_000)}k`;
  return `${sign}${symbol}${trim(abs)}`;
}

export const formatInvoiceTime = (timestamp: string | null) => {
    if (!timestamp) return 'No bill activity yet';

    const parsedDate = new Date(timestamp);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' });
    }

    const timeOnlyMatch = timestamp.match(/^(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))?$/);
    if (timeOnlyMatch) {
      const [, hours, minutes, seconds] = timeOnlyMatch;
      const date = new Date();
      date.setHours(Number(hours), Number(minutes), Number(seconds), 0);
      const formatted = date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      if (/^\d{1,2}:\d{2}$/.test(formatted)) {
        return formatted;
      }
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }

    return timestamp;
  };