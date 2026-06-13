export function getLocalDateTimeInputValue(
	date = new Date(),
): string {
	const localDate = new Date(
		date.getTime() - date.getTimezoneOffset() * 60_000,
	);
	return localDate.toISOString().slice(0, 16);
}

export function toUtcIsoString(input: string): string {
	return new Date(input).toISOString();
}

export function formatDateTime(
	value: Date | string,
	locale = "en-IN",
	timeZone?: string,
): string {
	const date =
		typeof value === "string" ? new Date(value) : value;
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
	const hour =
		parts.find((part) => part.type === "hour")?.value ?? "00";
	const minute =
		parts.find((part) => part.type === "minute")?.value ??
		"00";
	const day =
		parts.find((part) => part.type === "day")?.value ?? "01";
	const month =
		parts.find((part) => part.type === "month")?.value ??
		"Jan";
	const year =
		parts.find((part) => part.type === "year")?.value ??
		"1970";

	return `${hour}:${minute} • ${day} ${month} ${year}`;
}
