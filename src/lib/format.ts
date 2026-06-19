import { formatDateTime } from "@/lib/datetime";

export function formatCurrency(
	value: number,
	currency = "INR",
	_locale = "en-IN",
): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		notation: "compact",
		compactDisplay: "short",
		minimumFractionDigits: 0,
		maximumFractionDigits: 1,
	}).format(value);
}

export function formatDate(
	date: Date | string,
	locale = "en-IN",
	timeZone?: string,
): string {
	return formatDateTime(date, locale, timeZone);
}
