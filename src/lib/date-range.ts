export type DateRangePreset =
	| "this_week"
	| "this_month"
	| "this_year"
	| "custom";

export type GlobalDateRange = {
	preset: DateRangePreset;
	from?: string;
	to?: string;
};

export const DEFAULT_GLOBAL_RANGE: GlobalDateRange = {
	preset: "this_month",
};

function parseCustomBound(
	value: string,
	bound: "from" | "to",
): Date {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return new Date();
	}

	if (!value.includes("T")) {
		if (bound === "from") {
			date.setHours(0, 0, 0, 0);
		} else {
			date.setHours(23, 59, 59, 999);
		}
	}

	return date;
}

export function toRangeParams(range: GlobalDateRange): {
	preset?: string;
	from?: string;
	to?: string;
} {
	if (range.preset === "custom" && range.from && range.to) {
		return {
			preset: "custom",
			from: range.from,
			to: range.to,
		};
	}

	return { preset: range.preset };
}

export function rangeLabel(range: GlobalDateRange): string {
	if (range.preset === "this_week") return "This Week";
	if (range.preset === "this_year") return "This Year";
	if (range.preset === "custom") return "Custom";
	return "This Month";
}

export function hasValidCustomRange(
	range: GlobalDateRange,
): boolean {
	return Boolean(
		range.preset === "custom" && range.from && range.to,
	);
}

export function toIsoBounds(range: GlobalDateRange): {
	from?: string;
	to?: string;
} {
	const now = new Date();

	if (range.preset === "custom" && range.from && range.to) {
		const from = parseCustomBound(range.from, "from");
		const to = parseCustomBound(range.to, "to");
		return { from: from.toISOString(), to: to.toISOString() };
	}

	if (range.preset === "this_week") {
		const from = new Date(now);
		from.setDate(now.getDate() - 6);
		from.setHours(0, 0, 0, 0);
		return {
			from: from.toISOString(),
			to: now.toISOString(),
		};
	}

	if (range.preset === "this_year") {
		const from = new Date(now.getFullYear(), 0, 1);
		return {
			from: from.toISOString(),
			to: now.toISOString(),
		};
	}

	const from = new Date(
		now.getFullYear(),
		now.getMonth(),
		1,
	);
	return { from: from.toISOString(), to: now.toISOString() };
}
