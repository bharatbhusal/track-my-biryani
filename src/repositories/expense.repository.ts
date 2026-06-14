import {
	Types,
} from "mongoose";

import { ExpenseModel } from "@/models/Expense";
import type {
	ExpenseContribution,
	TrendPoint,
} from "@/types/analytics.types";

type ExpenseFilters = {
	q?: string;
	categoryId?: string;
	paymentMethod?: string;
	tags?: string;
	from?: string;
	to?: string;
	amountMin?: number;
	amountMax?: number;
	sortBy: "dateTime" | "amount" | "title";
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

type RangeStats = {
	total: number;
	count: number;
	avg: number;
	min: number;
	max: number;
	categoryBreakdown: CategoryBucket[];
	dailyTrend: TrendPoint[];
	weeklyTrend: TrendPoint[];
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
	paymentMethod?: string;
	tags?: string[];
	images: string[];
	location: {
		latitude: number;
		longitude: number;
		address?: string;
	};
	currency: string;
	dateTime: Date;
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
		deletedAt: null,
	};

	if (filters.q) {
		// Use case-insensitive substring search across title, notes, paymentMethod and tags
		const q = filters.q.trim();
		if (q.length > 0) {
			const regex = new RegExp(
				q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
				"i",
			);
			query.$or = [
				{ title: { $regex: regex } },
				{ notes: { $regex: regex } },
				{ paymentMethod: { $regex: regex } },
				{ tags: { $in: [q] } },
			];
		}
	}

	if (
		filters.categoryId &&
		Types.ObjectId.isValid(filters.categoryId)
	) {
		query.categoryId = filters.categoryId;
	}

	if (filters.paymentMethod) {
		query.paymentMethod = filters.paymentMethod;
	}

	if (filters.tags) {
		query.tags = {
			$in: filters.tags
				.split(",")
				.map((tag) => tag.trim())
				.filter(Boolean),
		};
	}

	if (filters.from || filters.to) {
		query.dateTime = {
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
		{ _id: expenseId, userId, deletedAt: null },
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

	return ExpenseModel.findOneAndUpdate(
		{ _id: expenseId, userId, deletedAt: null },
		{ deletedAt: new Date() },
		{ new: true, lean: true },
	);
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
		deletedAt: null,
	}).lean();
}

export async function listRecentExpenses(
	userId: string,
	limit = 5,
) {
	return ExpenseModel.find({ userId, deletedAt: null })
		.sort({ dateTime: -1 })
		.limit(limit)
		.lean();
}

export async function listExpensesForRange(
	userId: string,
	from: Date,
	to: Date,
) {
	return ExpenseModel.find({
		userId,
		deletedAt: null,
		dateTime: { $gte: from, $lte: to },
	}).lean();
}

export async function aggregateRangeStats(
	userId: string,
	from: Date,
	to: Date,
) {
	const match: Record<string, unknown> = {
		userId: new Types.ObjectId(userId),
		deletedAt: null,
		dateTime: { $gte: from, $lte: to },
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
							date: "$dateTime",
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
						$dayOfWeek: "$dateTime",
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

export async function getExpenseContribution(
	userId: string,
	expenseId: string,
) {
	if (!Types.ObjectId.isValid(expenseId)) return null;
	const expense = await ExpenseModel.findOne({
		_id: expenseId,
		userId,
		deletedAt: null,
	}).lean();
	if (!expense) return null;

	const amount = expense.amount;
	const date = new Date(expense.dateTime);

	const weekStart = new Date(date);
	weekStart.setDate(date.getDate() - 6);
	weekStart.setHours(0, 0, 0, 0);
	const monthStart = new Date(
		date.getFullYear(),
		date.getMonth(),
		1,
	);
	const yearStart = new Date(date.getFullYear(), 0, 1);

	const [weekTotal, monthTotal, yearTotal, categoryTotal] =
		(await Promise.all([
			ExpenseModel.aggregate([
				{
					$match: {
						userId,
						deletedAt: null,
						dateTime: { $gte: weekStart, $lte: date },
					},
				},
				{ $group: { _id: null, total: { $sum: "$amount" } } },
			]),
			ExpenseModel.aggregate([
				{
					$match: {
						userId,
						deletedAt: null,
						dateTime: { $gte: monthStart, $lte: date },
					},
				},
				{ $group: { _id: null, total: { $sum: "$amount" } } },
			]),
			ExpenseModel.aggregate([
				{
					$match: {
						userId,
						deletedAt: null,
						dateTime: { $gte: yearStart, $lte: date },
					},
				},
				{ $group: { _id: null, total: { $sum: "$amount" } } },
			]),
			ExpenseModel.aggregate([
				{
					$match: {
						userId,
						deletedAt: null,
						categoryId: expense.categoryId,
					},
				},
				{ $group: { _id: null, total: { $sum: "$amount" } } },
			]),
		])) as [
			AggregateBucket[],
			AggregateBucket[],
			AggregateBucket[],
			AggregateBucket[],
		];

	const week = weekTotal[0]?.total ?? 0;
	const month = monthTotal[0]?.total ?? 0;
	const year = yearTotal[0]?.total ?? 0;
	const cat = categoryTotal[0]?.total ?? 0;

	return {
		expenseId,
		amount,
		weekTotal: week,
		monthTotal: month,
		yearTotal: year,
		categoryTotal: cat,
		weekContributionPercent:
			week > 0 ? (amount / week) * 100 : 0,
		monthContributionPercent:
			month > 0 ? (amount / month) * 100 : 0,
		yearContributionPercent:
			year > 0 ? (amount / year) * 100 : 0,
		categoryContributionPercent:
			cat > 0 ? (amount / cat) * 100 : 0,
	} satisfies ExpenseContribution;
}
