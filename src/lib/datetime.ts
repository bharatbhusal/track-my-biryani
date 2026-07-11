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

export function formatShortDateTime(
	value: Date | string,
	locale = "en-IN",
): string {
	const date =
		typeof value === "string" ? new Date(value) : value;
	const now = new Date();

	const timeParts = new Intl.DateTimeFormat(locale, {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(date);
	const time =
		`${timeParts.find((p) => p.type === "hour")?.value ?? "00"}:${timeParts.find((p) => p.type === "minute")?.value ?? "00"}`;

	const startOfToday = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
	);
	const diff = date.getTime() - startOfToday.getTime();
	const dayMs = 86_400_000;

	if (diff >= 0 && diff < dayMs) return `Today, ${time}`;
	if (diff >= -dayMs && diff < 0)
		return `Yesterday, ${time}`;

	const dayParts = new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "short",
		weekday: "short",
	}).formatToParts(date);
	const day = dayParts.find((p) => p.type === "day")?.value ?? "";
	const month =
		dayParts.find((p) => p.type === "month")?.value ?? "";
	const weekday =
		dayParts.find((p) => p.type === "weekday")?.value ?? "";

	const isThisYear =
		date.getFullYear() === now.getFullYear();

	return isThisYear
		? `${day} ${month}, ${weekday}, ${time}`
		: `${day} ${month} ${date.getFullYear()}, ${weekday}, ${time}`;
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
