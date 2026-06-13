import { formatDateTime } from "@/lib/datetime";

export function formatCurrency(
	value: number,
	currency = "INR",
	locale = "en-IN",
): string {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

export function formatDate(
	date: Date | string,
	locale = "en-IN",
	timeZone?: string,
): string {
	return formatDateTime(date, locale, timeZone);
}
