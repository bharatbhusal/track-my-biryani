import { getAuthPayload } from "@/lib/auth";
import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { listCategories } from "@/repositories/category.repository";
import { listRecentExpenses } from "@/repositories/expense.repository";
import { aggregateRangeStats } from "@/repositories/expense.repository";
import type { DashboardAnalytics } from "@/types/analytics.types";

const DAYS_IN_WEEK = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
		const [analyticsResult, categories, recentActivity] =
			await Promise.all([
				aggregateRangeStats(auth.userId, fromDate, toDate),
				listCategories(auth.userId),
				listRecentExpenses(auth.userId, 8),
			]);
		const analytics = analyticsResult as Awaited<
			ReturnType<typeof aggregateRangeStats>
		>;

		const totalRangeSpend = analytics.total ?? 0;
		const rangeDays = Math.max(
			1,
			Math.ceil(
				(toDate.getTime() - fromDate.getTime()) / MS_PER_DAY,
			) + 1,
		);
		const weeklyTrend =
			analytics.dailyTrend.slice(-DAYS_IN_WEEK);
		const weeklySpend = weeklyTrend.reduce(
			(sum, trendPoint) => sum + trendPoint.total,
			0,
		);
		const dailyAverage = totalRangeSpend / rangeDays;

		const categoryBreakdown: DashboardAnalytics["categoryBreakdown"] =
			analytics.categoryBreakdown.map((cb) => {
				const category = categories.find(
					(item) => item._id.toString() === cb.categoryId,
				);
				return {
					name: category?.name ?? "Uncategorized",
					value: cb.value,
				};
			});

		const topCategory =
			categoryBreakdown.sort(
				(left, right) => right.value - left.value,
			)[0]?.name ?? "";

		return successResponse({
			totalMonthlySpend: totalRangeSpend,
			weeklySpend,
			dailyAverage,
			topCategory,
			categoryBreakdown,
			monthlyTrend: analytics.dailyTrend,
			weeklyTrend,
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
