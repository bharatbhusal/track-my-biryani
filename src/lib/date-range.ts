export type DateRangePreset =
	| "day"
	| "week"
	| "month"
	| "year";

export type GlobalDateRange = {
	preset: DateRangePreset;
	offset: number;
};

export const DEFAULT_GLOBAL_RANGE: GlobalDateRange = {
	preset: "month",
	offset: 0,
};

function getMonday(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

export function toRangeParams(range: GlobalDateRange): {
	preset?: string;
	offset?: number;
} {
	return { preset: range.preset, offset: range.offset };
}

export function rangeLabel(range: GlobalDateRange): string {
	if (range.preset === "day") return "Day";
	if (range.preset === "week") return "Week";
	if (range.preset === "year") return "Year";
	return "Month";
}

export function toIsoBounds(range: GlobalDateRange): {
	from?: string;
	to?: string;
} {
	const now = new Date();

	if (range.preset === "day") {
		const from = new Date(now);
		from.setDate(now.getDate() - range.offset);
		from.setHours(0, 0, 0, 0);
		if (range.offset === 0) {
			return { from: from.toISOString(), to: now.toISOString() };
		}
		const to = new Date(from);
		to.setHours(23, 59, 59, 999);
		return { from: from.toISOString(), to: to.toISOString() };
	}

	if (range.preset === "week") {
		const monday = getMonday(now);
		monday.setDate(monday.getDate() - range.offset * 7);
		const from = new Date(monday);
		if (range.offset === 0) {
			const to = new Date(now);
			return { from: from.toISOString(), to: to.toISOString() };
		}
		const to = new Date(monday);
		to.setDate(to.getDate() + 6);
		to.setHours(23, 59, 59, 999);
		return { from: from.toISOString(), to: to.toISOString() };
	}

	if (range.preset === "year") {
		const year = now.getFullYear() - range.offset;
		const from = new Date(year, 0, 1);
		if (range.offset === 0) {
			return { from: from.toISOString(), to: now.toISOString() };
		}
		const to = new Date(year, 11, 31, 23, 59, 59, 999);
		return { from: from.toISOString(), to: to.toISOString() };
	}

	const month = now.getMonth() - range.offset;
	const from = new Date(now.getFullYear(), month, 1);
	if (range.offset === 0) {
		return { from: from.toISOString(), to: now.toISOString() };
	}
	const to = new Date(now.getFullYear(), month + 1, 0, 23, 59, 59, 999);
	return { from: from.toISOString(), to: to.toISOString() };
}

export function toRangeDates(range: GlobalDateRange): {
	from: Date;
	to: Date;
} {
	const now = new Date();

	if (range.preset === "day") {
		const from = new Date(now);
		from.setDate(now.getDate() - range.offset);
		from.setHours(0, 0, 0, 0);
		if (range.offset === 0) return { from, to: now };
		const to = new Date(from);
		to.setHours(23, 59, 59, 999);
		return { from, to };
	}

	if (range.preset === "week") {
		const monday = getMonday(now);
		monday.setDate(monday.getDate() - range.offset * 7);
		const from = new Date(monday);
		if (range.offset === 0) return { from, to: now };
		const to = new Date(monday);
		to.setDate(to.getDate() + 6);
		to.setHours(23, 59, 59, 999);
		return { from, to };
	}

	if (range.preset === "year") {
		const year = now.getFullYear() - range.offset;
		const from = new Date(year, 0, 1);
		if (range.offset === 0) return { from, to: now };
		const to = new Date(year, 11, 31, 23, 59, 59, 999);
		return { from, to };
	}

	const month = now.getMonth() - range.offset;
	const from = new Date(now.getFullYear(), month, 1);
	if (range.offset === 0) return { from, to: now };
	const to = new Date(now.getFullYear(), month + 1, 0, 23, 59, 59, 999);
	return { from, to };
}

export function computePeriodLabel(
	from: Date,
	to: Date,
	preset: string,
	locale = "en-IN",
): string {
	if (preset === "day") {
		return new Intl.DateTimeFormat(locale, {
			day: "numeric",
			month: "long",
		}).format(from);
	}

	if (preset === "week") {
		const fromDay = from.getDate();
		const toDay = to.getDate();
		const month = new Intl.DateTimeFormat(locale, {
			month: "long",
		}).format(from);
		if (from.getMonth() === to.getMonth()) {
			return `${fromDay}-${toDay} ${month}`;
		}
		const toMonth = new Intl.DateTimeFormat(locale, {
			month: "long",
		}).format(to);
		return `${fromDay} ${month} - ${toDay} ${toMonth}`;
	}

	if (preset === "year") {
		return String(from.getFullYear());
	}

	return new Intl.DateTimeFormat(locale, {
		month: "long",
		year: "numeric",
	}).format(from);
}

export function rangePeriodLabel(range: GlobalDateRange): string {
	const { from, to } = toRangeDates(range);
	return computePeriodLabel(from, to, range.preset);
}

const STORAGE_KEY = "expense-tracker-range";

export function loadPersistedRange(): GlobalDateRange {
	if (typeof window === "undefined") return DEFAULT_GLOBAL_RANGE;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const p = JSON.parse(raw);
			if (p?.preset && typeof p.offset === "number") return p as GlobalDateRange;
		}
	} catch {
		/* ignore */
	}
	return DEFAULT_GLOBAL_RANGE;
}

export function persistRange(range: GlobalDateRange): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(range));
	} catch {
		/* ignore */
	}
}
