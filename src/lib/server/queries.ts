import "server-only";

import { getAuthPayload } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import {
	getExpenseById,
	getExpenseContribution,
	listExpenses,
	listExpensesForRange,
} from "@/repositories/expense.repository";
import {
	listCategories as listAllCategories,
	getCategoryById,
} from "@/repositories/category.repository";
import type { GlobalDateRange } from "@/lib/date-range";
import type {
	ExpenseItem,
	CategoryItem,
	ExpensesListPayload,
} from "@/types/expense.types";
import type {
	DashboardAnalytics,
	ExpenseContribution,
} from "@/types/analytics.types";

type Granularity = "hour" | "day" | "month";

function serialize<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}

async function getSession() {
	await connectToDatabase();
	const auth = await getAuthPayload();
	return auth;
}

function getMonday(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function parseRangeToDates(range: GlobalDateRange): {
	from: Date;
	to: Date;
} {
	const now = new Date();

	if (range.preset === "day") {
		const from = new Date(now);
		from.setDate(now.getDate() - (range.offset ?? 0));
		from.setHours(0, 0, 0, 0);
		if ((range.offset ?? 0) === 0) return { from, to: now };
		const to = new Date(from);
		to.setHours(23, 59, 59, 999);
		return { from, to };
	}

	if (range.preset === "week") {
		const monday = getMonday(now);
		monday.setDate(monday.getDate() - (range.offset ?? 0) * 7);
		const from = new Date(monday);
		if ((range.offset ?? 0) === 0) return { from, to: now };
		const to = new Date(monday);
		to.setDate(to.getDate() + 6);
		to.setHours(23, 59, 59, 999);
		return { from, to };
	}

	if (range.preset === "year") {
		const year = now.getFullYear() - (range.offset ?? 0);
		const from = new Date(year, 0, 1);
		if ((range.offset ?? 0) === 0) return { from, to: now };
		const to = new Date(year, 11, 31, 23, 59, 59, 999);
		return { from, to };
	}

	const month = now.getMonth() - (range.offset ?? 0);
	const from = new Date(now.getFullYear(), month, 1);
	if ((range.offset ?? 0) === 0) return { from, to: now };
	const to = new Date(now.getFullYear(), month + 1, 0, 23, 59, 59, 999);
	return { from, to };
}

function resolveGranularity(
	from: Date,
	to: Date,
	preset?: string,
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

function groupExpensesWithCategories(
	expenses: Array<{
		amount: number;
		paidAt: Date | string;
		categoryId: string;
	}>,
	categories: Array<{ _id: string; name: string }>,
	granularity: Granularity,
	locale = "en-IN",
): Array<Record<string, string | number>> {
	const byPeriod = new Map<
		string,
		Record<string, string | number>
	>();
	const categoryNameById = new Map(
		categories.map((c) => [c._id.toString(), c.name]),
	);

	expenses.forEach((expense) => {
		const date = new Date(expense.paidAt);
		let key = "";
		if (granularity === "hour") {
			key =
				date.getHours().toString().padStart(2, "0") + ":00";
		} else if (granularity === "month") {
			key = new Intl.DateTimeFormat(locale, {
				month: "short",
				year: "2-digit",
			}).format(date);
		} else {
			key = new Intl.DateTimeFormat(locale, {
				month: "short",
				day: "2-digit",
			}).format(date);
		}

		const categoryName =
			categoryNameById.get(expense.categoryId.toString()) ??
			"Uncategorized";
		const current = byPeriod.get(key) ?? { name: key };
		current[categoryName] =
			Number(current[categoryName] ?? 0) + expense.amount;
		byPeriod.set(key, current);
	});

	return Array.from(byPeriod.values());
}

export async function getServerDashboardData(
	range: GlobalDateRange,
): Promise<DashboardAnalytics> {
	const auth = await getSession();
	const { from, to } = parseRangeToDates(range);
	const preset = range.preset;

	const [expenses, categories] = await Promise.all([
		listExpensesForRange(auth.userId, from, to),
		listAllCategories(auth.userId),
	]);

	const totalSpend = expenses.reduce(
		(sum, e) => sum + e.amount,
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
		.sort((a, b) => b.value - a.value);

	return serialize({
		totalSpend,
		averageSpend,
		chartLabel,
		rankedCategories,
		stackedSeries,
		periodLabel: "",
		cards: [],
	});
}

export async function getServerExpenseDetail(
	id: string,
): Promise<{
	expense: ExpenseItem | null;
	categories: CategoryItem[];
	contribution: ExpenseContribution | null;
}> {
	const auth = await getSession();
	const [expense, categories, contribution] =
		await Promise.all([
			getExpenseById(auth.userId, id),
			listAllCategories(auth.userId),
			getExpenseContribution(auth.userId, id).catch(
				() => null,
			),
		]);

	return serialize({
		expense: expense as ExpenseItem | null,
		categories: categories as CategoryItem[],
		contribution,
	});
}

export async function getServerExpenseForm(
	id: string,
): Promise<{
	expense: ExpenseItem | null;
	categories: CategoryItem[];
}> {
	const auth = await getSession();
	const [expense, categories] = await Promise.all([
		getExpenseById(auth.userId, id),
		listAllCategories(auth.userId),
	]);

	return serialize({
		expense: expense as ExpenseItem | null,
		categories: categories as CategoryItem[],
	});
}

export async function getServerCategoryDetail(
	id: string,
): Promise<{
	category: CategoryItem | null;
	categoryExpenses: ExpenseItem[];
}> {
	const auth = await getSession();
	const [category, categoryExpenses] = await Promise.all([
		getCategoryById(auth.userId, id),
		listExpenses(auth.userId, {
			categoryId: id,
			page: 1,
			limit: 50,
			sortBy: "paidAt",
			order: "desc",
		}),
	]);

	return serialize({
		category: category as CategoryItem | null,
		categoryExpenses:
			(categoryExpenses as unknown as ExpensesListPayload)
				?.items ?? [],
	});
}

export async function getServerCategoryForm(
	id: string,
): Promise<{ category: CategoryItem | null }> {
	const auth = await getSession();
	const category = await getCategoryById(auth.userId, id);
	return serialize({
		category: category as CategoryItem | null,
	});
}

export async function getServerExpensesList(): Promise<{
	expenses: ExpensesListPayload;
	categories: CategoryItem[];
}> {
	const auth = await getSession();
	const [expenses, categories] = await Promise.all([
		listExpenses(auth.userId, {
			page: 1,
			limit: 20,
			sortBy: "paidAt",
			order: "desc",
		}),
		listAllCategories(auth.userId),
	]);

	return serialize({
		expenses: expenses as ExpensesListPayload,
		categories: categories as CategoryItem[],
	});
}

export async function getServerCategoriesList(): Promise<
	CategoryItem[]
> {
	const auth = await getSession();
	const categories = await listAllCategories(auth.userId);
	return serialize(categories as CategoryItem[]);
}
