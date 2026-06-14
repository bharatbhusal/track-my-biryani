import "server-only";

import { getAuthPayload } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import {
	getExpenseById,
	getExpenseContribution,
	listExpenses,
	listExpensesForRange,
	listRecentExpenses,
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

function parseRangeToDates(range: GlobalDateRange): {
	from: Date;
	to: Date;
} {
	const now = new Date();

	if (range.preset === "this_week") {
		const from = new Date(now);
		from.setDate(now.getDate() - 6);
		from.setHours(0, 0, 0, 0);
		return { from, to: now };
	}

	if (range.preset === "this_year") {
		return {
			from: new Date(now.getFullYear(), 0, 1),
			to: now,
		};
	}

	return {
		from: new Date(now.getFullYear(), now.getMonth(), 1),
		to: now,
	};
}

function resolveGranularity(
	from: Date,
	to: Date,
	preset?: string,
): {
	granularity: Granularity;
	averageLabel: string;
	chartLabel: string;
} {
	if (preset === "this_year") {
		return {
			granularity: "month",
			averageLabel: "Average spend per month",
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
			averageLabel: "Average spend per hour",
			chartLabel: "Hourly expenses",
		};
	}

	if (dayDiff > 60) {
		return {
			granularity: "month",
			averageLabel: "Average spend per month",
			chartLabel: "Monthly expenses",
		};
	}

	return {
		granularity: "day",
		averageLabel: "Average spend per day",
		chartLabel: "Daily expenses",
	};
}

function groupExpenses(
	expenses: Array<{
		amount: number;
		dateTime: Date | string;
	}>,
	granularity: Granularity,
	locale = "en-IN",
): Array<{ name: string; total: number }> {
	const map = new Map<string, number>();
	expenses.forEach((expense) => {
		const date = new Date(expense.dateTime);
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
		map.set(key, (map.get(key) ?? 0) + expense.amount);
	});
	return Array.from(map.entries()).map(([name, total]) => ({
		name,
		total,
	}));
}

function buildMonthlyCategorySeries(
	expenses: Array<{
		amount: number;
		dateTime: Date | string;
		categoryId: string;
	}>,
	categories: Array<{ _id: string; name: string }>,
	locale = "en-IN",
): Array<Record<string, string | number>> {
	const byMonth = new Map<
		string,
		Record<string, string | number>
	>();
	const categoryNameById = new Map(
		categories.map((c) => [c._id.toString(), c.name]),
	);

	expenses.forEach((expense) => {
		const date = new Date(expense.dateTime);
		const month = new Intl.DateTimeFormat(locale, {
			month: "short",
			year: "2-digit",
		}).format(date);
		const categoryName =
			categoryNameById.get(expense.categoryId.toString()) ??
			"Uncategorized";
		const current = byMonth.get(month) ?? { month };
		current[categoryName] =
			Number(current[categoryName] ?? 0) + expense.amount;
		byMonth.set(month, current);
	});

	return Array.from(byMonth.values());
}

export async function getServerDashboardData(
	range: GlobalDateRange,
): Promise<DashboardAnalytics> {
	const auth = await getSession();
	const { from, to } = parseRangeToDates(range);
	const preset = range.preset;

	const [expenses, categories, recentActivity] =
		await Promise.all([
			listExpensesForRange(auth.userId, from, to),
			listAllCategories(auth.userId),
			listRecentExpenses(auth.userId, 8),
		]);

	const totalSpend = expenses.reduce(
		(sum, e) => sum + e.amount,
		0,
	);
	const granularityMeta = resolveGranularity(
		from,
		to,
		preset,
	);
	const mainSeries = groupExpenses(
		expenses,
		granularityMeta.granularity,
	);
	const averageSpend =
		mainSeries.length > 0
			? totalSpend / mainSeries.length
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

	const topCategory = rankedCategories[0]?.name ?? "N/A";
	const dailyCashFlowSeries = groupExpenses(expenses, "day");
	const monthlyCategorySeries = buildMonthlyCategorySeries(
		expenses,
		categories,
	);

	return serialize({
		totalSpend,
		averageSpend,
		averageLabel: granularityMeta.averageLabel,
		chartLabel: granularityMeta.chartLabel,
		chartGranularity: granularityMeta.granularity,
		mainSeries,
		rankedCategories,
		monthlyCategorySeries,
		dailyCashFlowSeries,
		topCategory,
		recentActivity: recentActivity.map((item) => ({
			title: item.title,
			amount: item.amount,
			dateTime: item.dateTime,
		})),
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
			sortBy: "dateTime",
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
			sortBy: "dateTime",
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
