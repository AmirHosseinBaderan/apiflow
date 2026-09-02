import { Locale } from './store';

export function toShamsi(value: string | Date | number): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const parts = new Intl.DateTimeFormat('en-US', {
    calendar: 'persian',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}/${map.month}/${map.day} ${map.hour}:${map.minute}`;
}

export function formatDate(value: string | Date | number, locale: Locale = 'en'): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  if (locale === 'fa') {
    return new Intl.DateTimeFormat('fa-IR', {
      calendar: 'persian',
      numberingSystem: 'arab',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}
