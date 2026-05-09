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

const DAYS_IN_WEEK = 7;

function getDateRanges() {
	const now = new Date();
	const startMonth = new Date(
		now.getFullYear(),
		now.getMonth(),
		1,
	);
	const startWeek = new Date(now);
	startWeek.setDate(now.getDate() - 6);
	startWeek.setHours(0, 0, 0, 0);

	return { now, startMonth, startWeek };
}

export async function GET(request: Request) {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();
		const { now } = getDateRanges();

		const url = new URL(request.url);
		const preset = url.searchParams.get("preset");
		const fromParam = url.searchParams.get("from");
		const toParam = url.searchParams.get("to");

		let fromDate: Date;
		let toDate: Date = now;

		if (fromParam && toParam) {
			fromDate = new Date(fromParam);
			toDate = new Date(toParam);
		} else if (preset === "this_week") {
			const tmp = new Date(now);
			tmp.setDate(now.getDate() - 6);
			tmp.setHours(0, 0, 0, 0);
			fromDate = tmp;
		} else if (preset === "this_month") {
			fromDate = new Date(
				now.getFullYear(),
				now.getMonth(),
				1,
			);
		} else if (preset === "this_year") {
			fromDate = new Date(now.getFullYear(), 0, 1);
		} else {
			// default to this month
			fromDate = new Date(
				now.getFullYear(),
				now.getMonth(),
				1,
			);
		}
		const [rangeExpenses, categories, recentActivity] =
			await Promise.all([
				listExpensesForRange(auth.userId, fromDate, toDate),
				listCategories(auth.userId),
				listRecentExpenses(auth.userId, 8),
			]);

		const totalRangeSpend = rangeExpenses.reduce(
			(sum, item) => sum + item.amount,
			0,
		);
		// For weekly metrics, fall back to last 7 days calculated from 'toDate'
		const weekStart = new Date(toDate);
		weekStart.setDate(toDate.getDate() - 6);
		weekStart.setHours(0, 0, 0, 0);
		const weeklyExpenses = rangeExpenses.filter(
			(e) =>
				new Date(e.dateTime) >= weekStart &&
				new Date(e.dateTime) <= toDate,
		);
		const weeklySpend = weeklyExpenses.reduce(
			(sum, item) => sum + item.amount,
			0,
		);
		const dailyAverage =
			weeklyExpenses.length > 0
				? weeklySpend / DAYS_IN_WEEK
				: 0;

		const categoryMap = new Map<string, number>();
		rangeExpenses.forEach((expense) => {
			const key = expense.categoryId.toString();
			categoryMap.set(
				key,
				(categoryMap.get(key) ?? 0) + expense.amount,
			);
		});

		const categoryBreakdown = Array.from(
			categoryMap.entries(),
		).map(([categoryId, value]) => {
			const category = categories.find(
				(item) => item._id.toString() === categoryId,
			);
			return {
				name: category?.name ?? "Uncategorized",
				value,
			};
		});

		const topCategory =
			categoryBreakdown.sort((a, b) => b.value - a.value)[0]
				?.name ?? "";

		const dailyTrendMap = new Map<string, number>();
		rangeExpenses.forEach((expense) => {
			const day = new Date(expense.dateTime)
				.toISOString()
				.slice(0, 10); // YYYY-MM-DD
			dailyTrendMap.set(
				day,
				(dailyTrendMap.get(day) ?? 0) + expense.amount,
			);
		});

		const weeklyTrendMap = new Map<string, number>();
		weeklyExpenses.forEach((expense) => {
			const day = new Intl.DateTimeFormat("en-US", {
				weekday: "short",
			}).format(new Date(expense.dateTime));
			weeklyTrendMap.set(
				day,
				(weeklyTrendMap.get(day) ?? 0) + expense.amount,
			);
		});

		return successResponse({
			totalMonthlySpend: totalRangeSpend,
			weeklySpend,
			dailyAverage,
			topCategory,
			categoryBreakdown,
			monthlyTrend: Array.from(dailyTrendMap.entries()).map(
				([name, total]) => ({ name, total }),
			),
			weeklyTrend: Array.from(weeklyTrendMap.entries()).map(
				([name, total]) => ({ name, total }),
			),
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
