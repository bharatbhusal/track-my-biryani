import { getAuthPayload } from "@/lib/auth";
import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { listCategories } from "@/repositories/category.repository";
import {
	listExpensesForRange,
	listRecentExpenses,
} from "@/repositories/expense.repository";

type Granularity = "hour" | "day" | "month";

function parseRange(url: URL): { from: Date; to: Date } {
	const now = new Date();
	const preset = url.searchParams.get("preset");

	if (preset === "this_week") {
		const from = new Date(now);
		from.setDate(now.getDate() - 6);
		from.setHours(0, 0, 0, 0);
		return { from, to: now };
	}

	if (preset === "this_year") {
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
	preset?: string | null,
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
		categoryId: { toString: () => string };
	}>,
	categories: Array<{
		_id: { toString: () => string };
		name: string;
	}>,
	locale = "en-IN",
): Array<Record<string, string | number>> {
	const byMonth = new Map<
		string,
		Record<string, string | number>
	>();
	const categoryNameById = new Map(
		categories.map((category) => [
			category._id.toString(),
			category.name,
		]),
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

export async function GET(request: Request) {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();
		const url = new URL(request.url);
		const preset = url.searchParams.get("preset");
		const categoryId = url.searchParams.get("categoryId");
		const { from, to } = parseRange(url);

		const [expenses, categories, recentActivity] =
			await Promise.all([
				listExpensesForRange(auth.userId, from, to, categoryId ?? undefined),
				listCategories(auth.userId),
				listRecentExpenses(auth.userId, 8),
			]);

		const totalSpend = expenses.reduce(
			(sum, expense) => sum + expense.amount,
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
			.sort((left, right) => right.value - left.value);

		const topCategory = rankedCategories[0]?.name ?? "N/A";
		const dailyCashFlowSeries = groupExpenses(
			expenses,
			"day",
		);
		const monthlyCategorySeries = buildMonthlyCategorySeries(
			expenses,
			categories,
		);

		return successResponse({
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
	} catch (error) {
		return errorResponse(error);
	}
}
