import { Types } from "mongoose";

import { ExpenseModel } from "@/models/Expense";
import type {
	ExpenseContribution,
	TrendPoint,
} from "@/types/analytics.types";

type ExpenseFilters = {
	q?: string;
	categoryId?: string;
	from?: string;
	to?: string;
	amountMin?: number;
	amountMax?: number;
	sortBy: "paidAt" | "amount" | "title";
	order: "asc" | "desc";
	page: number;
	limit: number;
};

type AggregateBucket = {
	_id: string | null;
	total: number;
};

type SummaryBucket = {
	_id: null;
	total: number;
	count: number;
	avg: number;
	min: number;
	max: number;
};

type DailyTrendBucket = {
	_id: string;
	total: number;
};

type WeekdayBucket = {
	_id: number;
	total: number;
};

type CategoryBucket = {
	_id: Types.ObjectId | string | null;
	total: number;
};

const WEEKDAY_LABELS = [
	"Sun",
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
];

export async function createExpense(data: {
	userId: string;
	title: string;
	amount: number;
	categoryId: string;
	notes?: string;
	images: string[];
	location: {
		latitude: number;
		longitude: number;
		address?: string;
	};
	currency: string;
	paidAt?: Date;
}) {
	const expense = await ExpenseModel.create(data);
	return expense.toObject();
}

export async function listExpenses(
	userId: string,
	filters: ExpenseFilters,
) {
	const query: Record<string, unknown> = {
		userId,
	};

	if (filters.q) {
		// Use case-insensitive substring search across title and notes
		const q = filters.q.trim();
		if (q.length > 0) {
			const regex = new RegExp(
				q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
				"i",
			);
			query.$or = [
				{ title: { $regex: regex } },
				{ notes: { $regex: regex } },
			];
		}
	}

	if (
		filters.categoryId &&
		Types.ObjectId.isValid(filters.categoryId)
	) {
		query.categoryId = filters.categoryId;
	}

	if (filters.from || filters.to) {
		query.paidAt = {
			...(filters.from
				? { $gte: new Date(filters.from) }
				: {}),
			...(filters.to ? { $lte: new Date(filters.to) } : {}),
		};
	}

	if (
		typeof filters.amountMin === "number" ||
		typeof filters.amountMax === "number"
	) {
		query.amount = {
			...(typeof filters.amountMin === "number"
				? { $gte: filters.amountMin }
				: {}),
			...(typeof filters.amountMax === "number"
				? { $lte: filters.amountMax }
				: {}),
		};
	}

	const skip = (filters.page - 1) * filters.limit;

	const [items, total] = await Promise.all([
		ExpenseModel.find(query)
			.sort({
				[filters.sortBy]: filters.order === "asc" ? 1 : -1,
			})
			.skip(skip)
			.limit(filters.limit)
			.lean(),
		ExpenseModel.countDocuments(query),
	]);

	return {
		items,
		total,
		page: filters.page,
		totalPages: Math.ceil(total / filters.limit) || 1,
	};
}

export async function updateExpense(
	userId: string,
	expenseId: string,
	data: Record<string, unknown>,
) {
	if (!Types.ObjectId.isValid(expenseId)) {
		return null;
	}

	return ExpenseModel.findOneAndUpdate(
		{ _id: expenseId, userId },
		data,
		{ new: true, lean: true },
	);
}

export async function deleteExpense(
	userId: string,
	expenseId: string,
) {
	if (!Types.ObjectId.isValid(expenseId)) {
		return null;
	}

	return ExpenseModel.findOneAndDelete({
		_id: expenseId,
		userId,
	}).lean();
}

export async function getExpenseById(
	userId: string,
	expenseId: string,
) {
	if (!Types.ObjectId.isValid(expenseId)) {
		return null;
	}

	return ExpenseModel.findOne({
		_id: expenseId,
		userId,
	}).lean();
}

export async function listRecentExpenses(
	userId: string,
	limit = 5,
) {
	return ExpenseModel.find({ userId })
		.sort({ paidAt: -1 })
		.limit(limit)
		.lean();
}

export async function listExpensesForRange(
	userId: string,
	from: Date,
	to: Date,
	categoryId?: string,
) {
	const filter: Record<string, unknown> = {
		userId,

		paidAt: { $gte: from, $lte: to },
	};
	if (categoryId) {
		filter.categoryId = categoryId;
	}
	return ExpenseModel.find(filter)
		.sort({ paidAt: 1 })
		.lean();
}

export async function aggregateRangeStats(
	userId: string,
	from: Date,
	to: Date,
) {
	const match: Record<string, unknown> = {
		userId: new Types.ObjectId(userId),

		paidAt: { $gte: from, $lte: to },
	};

	const [
		totalResult,
		categoryBreakdown,
		dailyTrend,
		weeklyDocs,
	] = (await Promise.all([
		ExpenseModel.aggregate([
			{ $match: match },
			{
				$group: {
					_id: null,
					total: { $sum: "$amount" },
					count: { $sum: 1 },
					avg: { $avg: "$amount" },
					min: { $min: "$amount" },
					max: { $max: "$amount" },
				},
			},
		]),
		ExpenseModel.aggregate([
			{ $match: match },
			{
				$group: {
					_id: "$categoryId",
					total: { $sum: "$amount" },
				},
			},
		]),
		ExpenseModel.aggregate([
			{ $match: match },
			{
				$project: {
							day: {
								$dateToString: {
									format: "%Y-%m-%d",
									date: "$paidAt",
								},
					},
					amount: "$amount",
				},
			},
			{ $group: { _id: "$day", total: { $sum: "$amount" } } },
			{ $sort: { _id: 1 } },
		]),
		ExpenseModel.aggregate([
			{ $match: match },
			{
				$project: {
					weekday: {
						$dayOfWeek: "$paidAt",
					},
					amount: "$amount",
				},
			},
			{
				$group: { _id: "$weekday", total: { $sum: "$amount" } },
			},
			{ $sort: { _id: 1 } },
		]),
	])) as [
		SummaryBucket[],
		CategoryBucket[],
		DailyTrendBucket[],
		WeekdayBucket[],
	];

	const totals = totalResult[0] || {
		total: 0,
		count: 0,
		avg: 0,
		min: 0,
		max: 0,
	};

	const dailyTrendMap: TrendPoint[] = dailyTrend.map(
		(d) => ({
			name: d._id,
			total: d.total,
		}),
	);
	const weeklyTrendMap: TrendPoint[] = weeklyDocs.map(
		(d) => ({
			name:
				WEEKDAY_LABELS[Math.max(0, d._id - 1)] ?? String(d._id),
			total: d.total,
		}),
	);

	const categoryBreakdownFormatted = categoryBreakdown.map(
		(c) => ({
			categoryId: c._id?.toString?.() ?? "",
			value: c.total,
		}),
	);

	return {
		total: totals.total,
		count: totals.count,
		avg: totals.avg,
		min: totals.min,
		max: totals.max,
		categoryBreakdown: categoryBreakdownFormatted,
		dailyTrend: dailyTrendMap,
		weeklyTrend: weeklyTrendMap,
	};
}

export async function getCategoryRangeStats(
	userId: string,
	categoryId: string,
	from: Date,
	to: Date,
) {
	const match: Record<string, unknown> = {
		userId: new Types.ObjectId(userId),

		categoryId: new Types.ObjectId(categoryId),
		paidAt: { $gte: from, $lte: to },
	};

	const dayDiff = Math.ceil(
		(to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
	);
	const dateFormat =
		dayDiff > 60 ? "%Y-%m" : "%Y-%m-%d";

	const [[result], trend] = await Promise.all([
		ExpenseModel.aggregate<SummaryBucket>([
			{ $match: match },
			{
				$group: {
					_id: null,
					total: { $sum: "$amount" },
					count: { $sum: 1 },
					avg: { $avg: "$amount" },
					min: { $min: "$amount" },
					max: { $max: "$amount" },
				},
			},
		]),
		ExpenseModel.aggregate([
			{ $match: match },
			{
				$group: {
					_id: {
						$dateToString: {
							format: dateFormat,
							date: "$paidAt",
						},
					},
					total: { $sum: "$amount" },
				},
			},
			{ $sort: { _id: 1 } },
			{
				$project: {
					_id: 0,
					name: "$_id",
					total: 1,
				},
			},
		]),
	]);

	return {
		total: result?.total ?? 0,
		count: result?.count ?? 0,
		avg: result?.avg ?? 0,
		min: result?.min ?? 0,
		max: result?.max ?? 0,
		trend,
	};
}

export async function getExpenseContribution(
	userId: string,
	expenseId: string,
) {
	if (!Types.ObjectId.isValid(expenseId)) return null;
	const expense = await ExpenseModel.findOne({
		_id: new Types.ObjectId(expenseId),
		userId: new Types.ObjectId(userId),
	}).lean();
	if (!expense) return null;

	const amount = expense.amount;
	const date = new Date(expense.paidAt);

	const weekStart = new Date(date);
	weekStart.setDate(date.getDate() - 6);
	weekStart.setHours(0, 0, 0, 0);
	const monthStart = new Date(
		date.getFullYear(),
		date.getMonth(),
		1,
	);
	const yearStart = new Date(date.getFullYear(), 0, 1);
	const trendStart = new Date(date);
	trendStart.setFullYear(date.getFullYear() - 1);
	trendStart.setDate(1);
	trendStart.setHours(0, 0, 0, 0);

	const [
		weekTotal,
		monthTotal,
		yearTotal,
		categoryTotalResult,
		monthlyTrendResult,
		categoryCountResult,
	] = (await Promise.all([
		ExpenseModel.aggregate([
			{
				$match: {
					userId: new Types.ObjectId(userId),

					paidAt: { $gte: weekStart, $lte: date },
				},
			},
			{ $group: { _id: null, total: { $sum: "$amount" } } },
		]),
		ExpenseModel.aggregate([
			{
				$match: {
					userId: new Types.ObjectId(userId),

					paidAt: { $gte: monthStart, $lte: date },
				},
			},
			{ $group: { _id: null, total: { $sum: "$amount" } } },
		]),
		ExpenseModel.aggregate([
			{
				$match: {
					userId: new Types.ObjectId(userId),

					paidAt: { $gte: yearStart, $lte: date },
				},
			},
			{ $group: { _id: null, total: { $sum: "$amount" } } },
		]),
		ExpenseModel.aggregate([
			{
				$match: {
					userId: new Types.ObjectId(userId),

					categoryId: expense.categoryId,
				},
			},
			{ $group: { _id: null, total: { $sum: "$amount" } } },
		]),
		ExpenseModel.aggregate([
			{
				$match: {
					userId: new Types.ObjectId(userId),

					categoryId: expense.categoryId,
					paidAt: { $gte: trendStart, $lte: date },
				},
			},
			{
				$group: {
					_id: {
						$dateToString: {
							format: "%Y-%m",
							date: "$paidAt",
						},
					},
					total: { $sum: "$amount" },
				},
			},
			{ $sort: { _id: 1 } },
		]),
		ExpenseModel.countDocuments({
			userId: new Types.ObjectId(userId),

			categoryId: expense.categoryId,
		}),
	])) as [
		AggregateBucket[],
		AggregateBucket[],
		AggregateBucket[],
		AggregateBucket[],
		AggregateBucket[],
		number,
	];

	const week = weekTotal[0]?.total ?? 0;
	const month = monthTotal[0]?.total ?? 0;
	const year = yearTotal[0]?.total ?? 0;
	const cat = categoryTotalResult[0]?.total ?? 0;
	const categoryExpenseCount = categoryCountResult;
	const monthlyTrend: TrendPoint[] = monthlyTrendResult.map(
		(d) => ({
			name: d._id ?? "",
			total: d.total,
		}),
	);

	return {
		expenseId,
		amount,
		weekTotal: week,
		monthTotal: month,
		yearTotal: year,
		categoryTotal: cat,
		categoryExpenseCount,
		categoryAverage:
			categoryExpenseCount > 0
				? cat / categoryExpenseCount
				: 0,
		weekContributionPercent:
			week > 0 ? (amount / week) * 100 : 0,
		monthContributionPercent:
			month > 0 ? (amount / month) * 100 : 0,
		yearContributionPercent:
			year > 0 ? (amount / year) * 100 : 0,
		categoryContributionPercent:
			cat > 0 ? (amount / cat) * 100 : 0,
		monthlyTrend,
	} satisfies ExpenseContribution;
}
