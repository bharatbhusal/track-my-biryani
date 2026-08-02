import { formatDateTime } from "@/lib/datetime";

export function formatCurrency(
	value: number,
	currency = "INR",
): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		notation: "compact",
		compactDisplay: "short",
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

export function getChartLabel(
	preset: string,
	suffix: string,
) {
	return preset === "day"
		? `Hourly ${suffix}`
		: preset === `year`
			? `Monthly ${suffix}`
			: `Daily ${suffix}`;
}
