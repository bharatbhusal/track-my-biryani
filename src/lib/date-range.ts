export type DateRangePreset =
	| "this_week"
	| "this_month"
	| "this_year";

export type GlobalDateRange = {
	preset: DateRangePreset;
	from?: string;
	to?: string;
};

export const DEFAULT_GLOBAL_RANGE: GlobalDateRange = {
	preset: "this_month",
};

export function toRangeParams(range: GlobalDateRange): {
	preset?: string;
	from?: string;
	to?: string;
} {
	return { preset: range.preset };
}

export function rangeLabel(range: GlobalDateRange): string {
	if (range.preset === "this_week") return "This Week";
	if (range.preset === "this_year") return "This Year";
	return "This Month";
}

export function toIsoBounds(range: GlobalDateRange): {
	from?: string;
	to?: string;
} {
	const now = new Date();

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
