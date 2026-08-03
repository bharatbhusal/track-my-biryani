import { Types } from "mongoose";

import { ExpenseModel } from "@/models/Expense";
import { CategoryModel } from "@/models/Category";
import type {
	ExpenseContribution,
	CategoryBreakdownPoint,
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
	page?: number;
	limit?: number;
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
	bucketId: string;
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
	bucketId: string,
) {
	const query: Record<string, unknown> = { bucketId };

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

	const page = filters.page ?? 1;
	const limit = filters.limit ?? 50;
	const skip = (page - 1) * limit;

	const expensesQuery = ExpenseModel.find(query).populate(
		"userId",
		"name username",
	);

	const [items, total] = await Promise.all([
		expensesQuery
			.populate("categoryId", "emoji color")
			.select("title amount paidAt currency")
			.sort({
				[filters.sortBy]: filters.order === "asc" ? 1 : -1,
			})
			.skip(skip)
			.limit(limit)
			.lean(),
		ExpenseModel.countDocuments(query),
	]);

	const transformedItems = items.map((item) => {
		const posterName = (
			item.userId as { username?: string } | undefined
		)?.username ?? "";
		return {
			...item,
			...(posterName !== "" ? { posterName } : {}),
			categoryColor: item.categoryId?.color ?? "",
			categoryEmoji: item.categoryId?.emoji ?? "",
			categoryId:
				item.categoryId?._id?.toString() ??
				item.categoryId?.toString() ??
				"",
		};
	});

	return {
		items: transformedItems,
		total,
		page,
		totalPages: Math.ceil(total / limit) || 1,
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
	bucketId: string,
) {
	if (!Types.ObjectId.isValid(expenseId)) {
		return null;
	}

	return ExpenseModel.findOneAndDelete({
		_id: expenseId,
		userId,
		bucketId,
	}).lean();
}
export async function getExpenseById(
	userId: string,
	expenseId: string,
	bucketId: string,
) {
	if (!Types.ObjectId.isValid(expenseId)) {
		return null;
	}

	const expense = await ExpenseModel.findOne({
		_id: expenseId,
		userId,
		bucketId,
	})
		.populate("categoryId", "emoji color")
		.lean();

	if (!expense) return null;

	const category = expense.categoryId as {
		_id: Types.ObjectId;
		emoji: string;
		color: string;
	};

	return {
		...expense,
		categoryId: category._id.toString(),
		categoryEmoji: category.emoji,
		categoryColor: category.color,
	};
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
	bucketId: string,
	categoryId?: string,
) {
	const filter: Record<string, unknown> = {
		bucketId,
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
	bucketId: string,
) {
	const match: Record<string, unknown> = {
		bucketId: new Types.ObjectId(bucketId),
		paidAt: { $gte: from, $lte: to },
	};

	const categoryMatch: Record<string, unknown> = {
		...match,
		categoryId: new Types.ObjectId(categoryId),
	};

	const dayDiff = Math.ceil(
		(to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
	);
	const dateFormat = dayDiff > 60 ? "%Y-%m" : "%Y-%m-%d";

	const [categoryResult, totalResult, trend] =
		await Promise.all([
			ExpenseModel.aggregate<SummaryBucket>([
				{ $match: categoryMatch },
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
			ExpenseModel.aggregate<SummaryBucket>([
				{ $match: match },
				{
					$group: {
						_id: null,
						total: { $sum: "$amount" },
					},
				},
			]),
			ExpenseModel.aggregate([
				{ $match: categoryMatch },
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

	const category = categoryResult[0] ?? {
		total: 0,
		count: 0,
		avg: 0,
		min: 0,
		max: 0,
	};
	const total = totalResult[0]?.total ?? 0;

	return {
		total: category.total,
		count: category.count,
		avg: category.avg,
		min: category.min,
		max: category.max,
		pct: total > 0 ? (category.total / total) * 100 : 0,
		trend,
	};
}

export async function getExpenseContribution(
	userId: string,
	expenseId: string,
	bucketId: string,
	from?: Date,
	to?: Date,
) {
	if (!Types.ObjectId.isValid(expenseId)) return null;
	const expense = await ExpenseModel.findOne({
		_id: new Types.ObjectId(expenseId),
		userId: new Types.ObjectId(userId),
		bucketId: new Types.ObjectId(bucketId),
	}).lean();
	if (!expense) return null;

	const scopeFilter: Record<string, unknown> = {
		bucketId: new Types.ObjectId(bucketId),
	};

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

	const categoryMatch: Record<string, unknown> = {
		...scopeFilter,
		categoryId: expense.categoryId,
	};
	if (from || to) {
		const paidAt: Record<string, Date> = {};
		if (from) paidAt.$gte = from;
		if (to) paidAt.$lte = to;
		categoryMatch.paidAt = paidAt;
	}

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
					...scopeFilter,
					paidAt: { $gte: weekStart, $lte: date },
				},
			},
			{ $group: { _id: null, total: { $sum: "$amount" } } },
		]),
		ExpenseModel.aggregate([
			{
				$match: {
					...scopeFilter,
					paidAt: { $gte: monthStart, $lte: date },
				},
			},
			{ $group: { _id: null, total: { $sum: "$amount" } } },
		]),
		ExpenseModel.aggregate([
			{
				$match: {
					...scopeFilter,
					paidAt: { $gte: yearStart, $lte: date },
				},
			},
			{ $group: { _id: null, total: { $sum: "$amount" } } },
		]),
		ExpenseModel.aggregate([
			{ $match: categoryMatch },
			{ $group: { _id: null, total: { $sum: "$amount" } } },
		]),
		ExpenseModel.aggregate([
			{
				$match: {
					...scopeFilter,
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
		ExpenseModel.countDocuments([categoryMatch]),
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

export async function getCategoryDistribution(
	userId: string,
	from: Date,
	to: Date,
	bucketId: string,
): Promise<CategoryBreakdownPoint[]> {
	const match: Record<string, unknown> = {
		bucketId: new Types.ObjectId(bucketId),
		paidAt: { $gte: from, $lte: to },
	};

	const [categoryTotals, categories] = await Promise.all([
		ExpenseModel.aggregate([
			{ $match: match },
			{
				$group: {
					_id: "$categoryId",
					value: { $sum: "$amount" },
				},
			},
		]),
		CategoryModel.find({ bucketId }).lean(),
	]);

	const nameById = new Map(
		categories.map((c) => [c._id.toString(), c.name]),
	);

	const colorById = new Map(
		categories.map((c) => [c._id.toString(), c.color]),
	);

	return categoryTotals
		.map((b) => ({
			name: nameById.get(b._id.toString()) ?? "Uncategorized",
			value: b.value,
			color: colorById.get(b._id.toString()) ?? "#6b7280",
			categoryId: b._id.toString(),
		}))
		.sort((a, b) => b.value - a.value);
}

export async function getExpenseOverviewStats(
	userId: string,
	from: Date,
	to: Date,
	bucketId: string,
) {
	const match: Record<string, unknown> = {
		bucketId: new Types.ObjectId(bucketId),
		paidAt: { $gte: from, $lte: to },
	};

	const [result] = await ExpenseModel.aggregate([
		{ $match: match },
		{
			$group: {
				_id: null,
				total: { $sum: "$amount" },
				count: { $sum: 1 },
			},
		},
	]);

	return {
		total: result?.total ?? 0,
		count: result?.count ?? 0,
	};
}

export async function getChartData(
	userId: string,
	from: Date,
	to: Date,
	bucketId: string,
	categoryId?: string,
) {
	const match: Record<string, unknown> = {
		bucketId: new Types.ObjectId(bucketId),
		paidAt: { $gte: from, $lte: to },
	};
	if (categoryId) {
		match.categoryId = new Types.ObjectId(categoryId);
	}

	const dayDiff = Math.ceil(
		(to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
	);

	let dateGroup: Record<string, unknown>;
	if (dayDiff <= 1) {
		dateGroup = {
			hour: { $floor: { $divide: [{ $hour: "$paidAt" }, 2] } },
		};
	} else if (dayDiff > 60) {
		dateGroup = {
			$dateToString: { format: "%Y-%m", date: "$paidAt" },
		};
	} else {
		dateGroup = {
			$dateToString: { format: "%Y-%m-%d", date: "$paidAt" },
		};
	}

	const [periodData, categories] = await Promise.all([
		ExpenseModel.aggregate([
			{ $match: match },
			{
				$group: {
					_id: {
						period: dateGroup,
						categoryId: "$categoryId",
					},
					total: { $sum: "$amount" },
				},
			},
			{ $sort: { "_id.period": 1 } },
		]),
		CategoryModel.find(
			bucketId ? { bucketId } : { userId, bucketId: null },
		).lean(),
	]);

	const nameById = new Map(
		categories.map((c) => [c._id.toString(), c.name]),
	);

	const periodMap = new Map<
		string,
		Record<string, number>
	>();
	const periodOrder: string[] = [];
	const periodTotals = new Map<string, number>();

	for (const row of periodData) {
		const periodKey = formatPeriodLabel(
			row._id.period,
			dayDiff,
		);
		const catName =
			nameById.get(row._id.categoryId.toString()) ??
			"Uncategorized";

		if (!periodMap.has(periodKey)) {
			periodMap.set(periodKey, {});
			periodOrder.push(periodKey);
			periodTotals.set(periodKey, 0);
		}
		const entry = periodMap.get(periodKey)!;
		entry[catName] = (entry[catName] ?? 0) + row.total;
		periodTotals.set(
			periodKey,
			(periodTotals.get(periodKey) ?? 0) + row.total,
		);
	}

	const series = periodOrder.map((key) => {
		const categories = periodMap.get(key) ?? {};
		return { name: key, ...categories };
	});

	const totals = Array.from(periodTotals.values());
	const total = totals.reduce((s, v) => s + v, 0);
	const count = totals.length;
	const avg = count > 0 ? total / count : 0;
	const min = count > 0 ? Math.min(...totals) : 0;
	const max = count > 0 ? Math.max(...totals) : 0;

	const categoryColors: Record<string, string> = {};
	for (const cat of categories) {
		categoryColors[cat.name] = cat.color;
	}

	return {
		series,
		stats: { avg, min, max, total },
		categoryColors,
	};
}

function formatPeriodLabel(
	id: string | number,
	dayDiff: number,
): string {
	if (dayDiff <= 1) {
		const hour = Number(id) * 2;
		return `${String(hour).padStart(2, "0")}:00`;
	}
	if (typeof id === "string" && id.length === 7) {
		const [y, m] = id.split("-");
		const date = new Date(Number(y), Number(m) - 1, 1);
		return new Intl.DateTimeFormat("en-IN", {
			month: "short",
			year: "2-digit",
		}).format(date);
	}
	if (typeof id === "string" && id.length === 10) {
		const date = new Date(id + "T00:00:00");
		return new Intl.DateTimeFormat("en-IN", {
			month: "short",
			day: "2-digit",
		}).format(date);
	}
	return String(id);
}
