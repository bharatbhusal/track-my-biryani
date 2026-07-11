import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import { computePeriodLabel, toRangeDates } from "@/lib/date-range";
import type { GlobalDateRange } from "@/lib/date-range";
import type { DashboardCard } from "@/types/analytics.types";

type Granularity = "hour" | "day" | "month";

function resolveGranularity(
	from: Date,
	to: Date,
	preset?: string,
): { granularity: Granularity; chartLabel: string } {
	if (preset === "year") {
		return { granularity: "month", chartLabel: "Monthly expenses" };
	}
	const dayDiff = Math.max(
		1,
		Math.ceil((to.getTime() - from.getTime()) / (86400000)) + 1,
	);
	if (dayDiff <= 1) {
		return { granularity: "hour", chartLabel: "Hourly expenses" };
	}
	if (dayDiff > 60) {
		return { granularity: "month", chartLabel: "Monthly expenses" };
	}
	return { granularity: "day", chartLabel: "Daily expenses" };
}

function* iteratePeriods(
	from: Date,
	to: Date,
	granularity: Granularity,
): Generator<Date> {
	const cursor = new Date(from);
	if (granularity === "hour") {
		cursor.setMinutes(0, 0, 0);
		cursor.setHours(0);
		const end = new Date(to);
		for (let h = 0; h < 24; h++) {
			cursor.setHours(h);
			if (cursor > end) break;
			yield new Date(cursor);
		}
		return;
	}
	if (granularity === "day") {
		cursor.setHours(0, 0, 0, 0);
		while (cursor <= to) {
			yield new Date(cursor);
			cursor.setDate(cursor.getDate() + 1);
		}
		return;
	}
	cursor.setDate(1);
	cursor.setHours(0, 0, 0, 0);
	while (cursor <= to) {
		yield new Date(cursor);
		cursor.setMonth(cursor.getMonth() + 1);
	}
}

function periodKey(
	date: Date,
	granularity: Granularity,
	locale = "en-IN",
): string {
	if (granularity === "hour") {
		return date.getHours().toString().padStart(2, "0") + ":00";
	}
	if (granularity === "month") {
		return new Intl.DateTimeFormat(locale, {
			month: "short",
			year: "2-digit",
		}).format(date);
	}
	return new Intl.DateTimeFormat(locale, {
		month: "short",
		day: "2-digit",
	}).format(date);
}

function groupExpensesWithCategories(
	expenses: Array<{ amount: number; paidAt: string; categoryId: string }>,
	categories: Array<{ _id: string; name: string }>,
	granularity: Granularity,
	locale: string,
	from: Date,
	to: Date,
): Array<Record<string, string | number>> {
	const byPeriod = new Map<string, Record<string, string | number>>();
	const order = new Map<string, number>();
	const categoryNames = categories.map((c) => c.name);
	let idx = 0;

	for (const date of iteratePeriods(from, to, granularity)) {
		const key = periodKey(date, granularity, locale);
		const entry: Record<string, string | number> = { name: key };
		for (const name of categoryNames) {
			entry[name] = 0;
		}
		byPeriod.set(key, entry);
		order.set(key, idx++);
	}

	const categoryNameById = new Map(
		categories.map((c) => [c._id, c.name]),
	);

	expenses.forEach((expense) => {
		const date = new Date(expense.paidAt);
		const key = periodKey(date, granularity, locale);
		const categoryName =
			categoryNameById.get(expense.categoryId) ?? "Uncategorized";
		const current = byPeriod.get(key) ?? { name: key };
		current[categoryName] =
			Number(current[categoryName] ?? 0) + expense.amount;
		byPeriod.set(key, current);
	});

	const result = Array.from(byPeriod.entries())
		.sort((a, b) => (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0))
		.map(([, value]) => value);

	const categoryTotals = new Map<string, number>();
	for (const item of result) {
		for (const [key, val] of Object.entries(item)) {
			if (key !== "name" && typeof val === "number") {
				categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + val);
			}
		}
	}
	const activeCategories = new Set(
		Array.from(categoryTotals.entries())
			.filter(([, total]) => total > 0)
			.map(([name]) => name),
	);

	return result.map((item) => {
		const filtered: Record<string, string | number> = {
			name: item.name as string,
		};
		for (const [key, val] of Object.entries(item)) {
			if (key !== "name" && activeCategories.has(key)) {
				filtered[key] = val;
			}
		}
		return filtered;
	});
}

const selectDashboardExpenses = (s: RootState) => s.dashboard.expenses;
const selectDashboardCategories = (s: RootState) => s.dashboard.categories;
const selectDashboardLoading = (s: RootState) => s.dashboard.loading;
const selectDashboardError = (s: RootState) => s.dashboard.error;

function makeSelectRange() {
	return (_s: RootState, range: GlobalDateRange) => range;
}

const selectRange = makeSelectRange();

export const selectTotalSpend = createSelector(
	[selectDashboardExpenses],
	(expenses) => expenses.reduce((sum, e) => sum + e.amount, 0),
);

export const selectRankedCategories = createSelector(
	[selectDashboardExpenses, selectDashboardCategories],
	(expenses, categories) => {
		const totals = new Map<string, number>();
		expenses.forEach((e) => {
			totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amount);
		});
		return Array.from(totals.entries())
			.map(([categoryId, value]) => {
				const cat = categories.find((c) => c._id === categoryId);
				return { name: cat?.name ?? "Uncategorized", value };
			})
			.sort((a, b) => b.value - a.value);
	},
);

export const selectStackedSeries = createSelector(
	[
		selectDashboardExpenses,
		selectDashboardCategories,
		selectRange,
	],
	(expenses, categories, range) => {
		const { from, to } = toRangeDates(range);
		const { granularity } = resolveGranularity(from, to, range.preset);
		return groupExpensesWithCategories(
			expenses,
			categories,
			granularity,
			"en-IN",
			from,
			to,
		);
	},
);

export const selectPeriodLabel = createSelector(
	[selectRange],
	(range) => {
		const { from, to } = toRangeDates(range);
		return computePeriodLabel(from, to, range.preset);
	},
);

export const selectAverageSpend = createSelector(
	[selectDashboardExpenses, selectStackedSeries],
	(expenses, series) => {
		const total = expenses.reduce((sum, e) => sum + e.amount, 0);
		return series.length > 0 ? total / series.length : 0;
	},
);

export const selectCards = createSelector(
	[selectTotalSpend, selectRange],
	(totalSpend, range): DashboardCard[] => {
		const { from, to } = toRangeDates(range);
		const cards: DashboardCard[] = [
			{ key: "total_spend", title: "Total Spend", value: totalSpend },
		];
		if (range.preset === "day") return cards;
		if (range.preset === "week") {
			cards.push({
				key: "spend_per_day",
				title: "Spend per Day",
				value: totalSpend / 7,
			});
			return cards;
		}
		if (range.preset === "year") {
			const months =
				to.getMonth() -
				from.getMonth() +
				1 +
				(to.getFullYear() - from.getFullYear()) * 12;
			cards.push({
				key: "spend_per_month",
				title: "Spend per Month",
				value: months > 0 ? totalSpend / months : totalSpend,
			});
			return cards;
		}
		const dayDiff = Math.max(
			1,
			Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1,
		);
		cards.push({
			key: "spend_per_day",
			title: "Spend per Day",
			value: dayDiff > 0 ? totalSpend / dayDiff : totalSpend,
		});
		return cards;
	},
);

export {
	selectDashboardExpenses as selectExpenses,
	selectDashboardCategories as selectCategories,
	selectDashboardLoading as selectDashboardIsLoading,
	selectDashboardError as selectDashboardError_msg,
};
