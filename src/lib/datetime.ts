export function getLocalDateTimeInputValue(date = new Date()): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function toUtcIsoString(input: string): string {
  return new Date(input).toISOString();
}

function getRelativePrefix(date: Date, now: Date): string | null {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = date.getTime() - startOfToday.getTime();
  const dayMs = 86_400_000;

  if (diff >= 0 && diff < dayMs) return "Today";
  if (diff >= -dayMs && diff < 0) return "Yesterday";
  return null;
}

function formatDateParts(date: Date, locale: string, includeYear: boolean): string {
  const parts = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    weekday: "short",
    ...(includeYear && { year: "numeric" }),
  }).formatToParts(date);

  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";

  return includeYear && date.getFullYear() !== new Date().getFullYear()
    ? `${day} ${month} ${year}, ${weekday}`
    : `${day} ${month}, ${weekday}`;
}

function formatTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatShortDateTime(value: Date | string, locale = "en-IN"): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const now = new Date();

  const relative = getRelativePrefix(date, now);
  if (relative) return `${relative}, ${formatTime(date, locale)}`;

  const isThisYear = date.getFullYear() === now.getFullYear();
  return `${formatDateParts(date, locale, !isThisYear)}, ${formatTime(date, locale)}`;
}

export function formatShortDate(value: Date | string, locale = "en-IN"): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const now = new Date();

  const relative = getRelativePrefix(date, now);
  if (relative) return relative;

  const isThisYear = date.getFullYear() === now.getFullYear();
  return formatDateParts(date, locale, !isThisYear);
}

export function formatDateTime(value: Date | string, locale = "en-IN", timeZone?: string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour12: false,
    timeZone,
  });

  const parts = formatter.formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  const month = parts.find((p) => p.type === "month")?.value ?? "Jan";
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";

  return `${hour}:${minute} • ${day} ${month} ${year}`;
}
