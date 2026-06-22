import { getAuthPayload } from "@/lib/auth";
import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { listCategories } from "@/repositories/category.repository";
import { listExpensesForRange } from "@/repositories/expense.repository";
import type { DashboardCard } from "@/types/analytics.types";

type Granularity = "hour" | "day" | "month";

function getMonday(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function parseRange(url: URL): { from: Date; to: Date } {
	const now = new Date();
	const preset = url.searchParams.get("preset") ?? "month";
	const offset = parseInt(
		url.searchParams.get("offset") ?? "0",
		10,
	);

	if (preset === "day") {
		const from = new Date(now);
		from.setDate(now.getDate() - offset);
		from.setHours(0, 0, 0, 0);
		if (offset === 0) return { from, to: now };
		const to = new Date(from);
		to.setHours(23, 59, 59, 999);
		return { from, to };
	}

	if (preset === "week") {
		const monday = getMonday(now);
		monday.setDate(monday.getDate() - offset * 7);
		const from = new Date(monday);
		if (offset === 0) return { from, to: now };
		const to = new Date(monday);
		to.setDate(to.getDate() + 6);
		to.setHours(23, 59, 59, 999);
		return { from, to };
	}

	if (preset === "year") {
		const year = now.getFullYear() - offset;
		const from = new Date(year, 0, 1);
		if (offset === 0) return { from, to: now };
		const to = new Date(year, 11, 31, 23, 59, 59, 999);
		return { from, to };
	}

	const month = now.getMonth() - offset;
	const from = new Date(now.getFullYear(), month, 1);
	if (offset === 0) return { from, to: now };
	const to = new Date(
		now.getFullYear(),
		month + 1,
		0,
		23,
		59,
		59,
		999,
	);
	return { from, to };
}

function computePeriodLabel(
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

function computeCards(
	totalSpend: number,
	from: Date,
	to: Date,
	preset: string,
): DashboardCard[] {
	const cards: DashboardCard[] = [
		{
			key: "total_spend",
			title: "Total Spend",
			value: totalSpend,
		},
	];

	if (preset === "day") return cards;

	if (preset === "week") {
		const days = 7;
		cards.push({
			key: "spend_per_day",
			title: "Spend per Day",
			value: days > 0 ? totalSpend / days : totalSpend,
		});
		return cards;
	}

	if (preset === "year") {
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
		Math.ceil(
			(to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000),
		) + 1,
	);
	cards.push({
		key: "spend_per_day",
		title: "Spend per Day",
		value: dayDiff > 0 ? totalSpend / dayDiff : totalSpend,
	});
	return cards;
}

function resolveGranularity(
	from: Date,
	to: Date,
	preset?: string | null,
): {
	granularity: Granularity;
	chartLabel: string;
} {
	if (preset === "year") {
		return {
			granularity: "month",
			chartLabel: "Monthly expenses",
		};
	}

	const dayDiff = Math.max(
		1,
		Math.ceil(
			(to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000),
		) + 1,
	);

	if (dayDiff <= 1) {
		return {
			granularity: "hour",
			chartLabel: "Hourly expenses",
		};
	}

	if (dayDiff > 60) {
		return {
			granularity: "month",
			chartLabel: "Monthly expenses",
		};
	}

	return {
		granularity: "day",
		chartLabel: "Daily expenses",
	};
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
		return (
			date.getHours().toString().padStart(2, "0") + ":00"
		);
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
	expenses: Array<{
		amount: number;
		paidAt: Date | string;
		categoryId: { toString: () => string };
	}>,
	categories: Array<{
		_id: { toString: () => string };
		name: string;
	}>,
	granularity: Granularity,
	locale: string,
	from: Date,
	to: Date,
): Array<Record<string, string | number>> {
	const byPeriod = new Map<
		string,
		Record<string, string | number>
	>();
	const order = new Map<string, number>();
	const categoryNames = categories.map((c) => c.name);
	let idx = 0;

	for (const date of iteratePeriods(from, to, granularity)) {
		const key = periodKey(date, granularity, locale);
		const entry: Record<string, string | number> = {
			name: key,
		};
		for (const name of categoryNames) {
			entry[name] = 0;
		}
		byPeriod.set(key, entry);
		order.set(key, idx++);
	}

	const categoryNameById = new Map(
		categories.map((c) => [c._id.toString(), c.name]),
	);

	expenses.forEach((expense) => {
		const date = new Date(expense.paidAt);
		const key = periodKey(date, granularity, locale);
		const categoryName =
			categoryNameById.get(expense.categoryId.toString()) ??
			"Uncategorized";
		const current = byPeriod.get(key) ?? { name: key };
		current[categoryName] =
			Number(current[categoryName] ?? 0) + expense.amount;
		byPeriod.set(key, current);
	});

	const result = Array.from(byPeriod.entries())
		.sort(
			(a, b) =>
				(order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0),
		)
		.map(([, value]) => value);

	const categoryTotals = new Map<string, number>();
	for (const item of result) {
		for (const [key, val] of Object.entries(item)) {
			if (key !== "name" && typeof val === "number") {
				categoryTotals.set(
					key,
					(categoryTotals.get(key) ?? 0) + val,
				);
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

export async function GET(request: Request) {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();
		const url = new URL(request.url);
		const preset = url.searchParams.get("preset");
		const categoryId = url.searchParams.get("categoryId");
		const { from, to } = parseRange(url);

		const [expenses, categories] = await Promise.all([
			listExpensesForRange(
				auth.userId,
				from,
				to,
				categoryId ?? undefined,
			),
			listCategories(auth.userId),
		]);

		const totalSpend = expenses.reduce(
			(sum, expense) => sum + expense.amount,
			0,
		);
		const { granularity, chartLabel } = resolveGranularity(
			from,
			to,
			preset,
		);
		const stackedSeries = groupExpensesWithCategories(
			expenses,
			categories,
			granularity,
			"en-IN",
			from,
			to,
		);
		const averageSpend =
			stackedSeries.length > 0
				? totalSpend / stackedSeries.length
				: 0;

		const categoryTotals = new Map<string, number>();
		expenses.forEach((expense) => {
			categoryTotals.set(
				expense.categoryId.toString(),
				(categoryTotals.get(expense.categoryId.toString()) ??
					0) + expense.amount,
			);
		});

		const rankedCategories = Array.from(
			categoryTotals.entries(),
		)
			.map(([categoryId, value]) => {
				const category = categories.find(
					(item) => item._id.toString() === categoryId,
				);
				return {
					name: category?.name ?? "Uncategorized",
					value,
				};
			})
			.sort((left, right) => right.value - left.value);

		return successResponse({
			totalSpend,
			averageSpend,
			chartLabel,
			rankedCategories,
			stackedSeries,
			periodLabel: computePeriodLabel(
				from,
				to,
				preset ?? "month",
			),
			cards: computeCards(
				totalSpend,
				from,
				to,
				preset ?? "month",
			),
		});
	} catch (error) {
		return errorResponse(error);
	}
}
