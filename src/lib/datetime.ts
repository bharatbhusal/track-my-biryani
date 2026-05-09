export function getDeviceDateTimeLocalInputValue(date = new Date()): string {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

export function localDateTimeInputToUtcIso(value: string): string {
  return new Date(value).toISOString();
}

export function formatDateTime(date: Date | string, locale = 'en-US', timeZone?: string): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(value);
  const day = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone,
  }).format(value);

  return `${time} • ${day}`;
}
