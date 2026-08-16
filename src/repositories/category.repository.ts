import { Types } from "mongoose";

import { buildCategoryQuery } from "@/lib/query-builders";
import { CategoryModel } from "@/models/Category";
import { ExpenseModel } from "@/models/Expense";
import { AppError } from "@/lib/errors";
import type {
	CategorySearchRequest,
	SearchResult,
} from "@/types/search.types";
import type { CategoryItem } from "@/types/expense.types";

export async function createCategory(data: {
	userId: string;
	name: string;
	color: string;
	emoji?: string;
	bucketId: string;
}) {
	const category = await CategoryModel.create({
		...data,
		bucketId: new Types.ObjectId(data.bucketId),
	});
	return category.toObject();
}

export async function ensureCategoryInBucket(
	userId: string,
	bucketId: string,
	data: { name: string; color: string; emoji?: string },
) {
	const filter = {
		bucketId: new Types.ObjectId(bucketId),
		name: data.name,
	};

	const existing =
		await CategoryModel.findOne(filter).lean();
	if (existing) {
		return existing;
	}

	try {
		const category = await CategoryModel.create({
			userId,
			bucketId: new Types.ObjectId(bucketId),
			name: data.name,
			color: data.color,
			emoji: data.emoji,
		});
		return category.toObject();
	} catch (error) {
		// ponytail: concurrent create loses the race → re-find the winner
		const refound =
			await CategoryModel.findOne(filter).lean();
		if (refound) {
			return refound;
		}
		throw error;
	}
}

export async function listCategories(bucketId: string) {
	return CategoryModel.find({ bucketId })
		.sort({ createdAt: -1 })
		.lean();
}

export async function deleteCategoriesByBucket(
	bucketId: string,
) {
	return CategoryModel.deleteMany({
		bucketId: new Types.ObjectId(bucketId),
	});
}

export async function listCategoriesWithStats(
	categoryQuery: Record<string, unknown>,
	from: Date,
	to: Date,
) {
	const categories =
		await CategoryModel.find(categoryQuery).lean();

	const match: Record<string, unknown> = {
		categoryId: {
			$in: categories.map((c) => c._id as Types.ObjectId),
		},
		paidAt: {
			$gte: from,
			$lte: to,
		},
	};

	if (categoryQuery.bucketId) {
		match.bucketId = categoryQuery.bucketId;
	}

	const categoryStats = await ExpenseModel.aggregate([
		{ $match: match },
		{
			$group: {
				_id: "$categoryId",
				total: { $sum: "$amount" },
				expenseCount: { $sum: 1 },
				min: { $min: "$amount" },
				max: { $max: "$amount" },
				avg: { $avg: "$amount" },
			},
		},
	]);

	const statsById = new Map(
		categoryStats.map((s) => [s._id.toString(), s]),
	);

	// Overall expense statistics
	const total = categoryStats.reduce(
		(acc, s) => acc + s.total,
		0,
	);

	const expenseCount = categoryStats.reduce(
		(acc, s) => acc + s.expenseCount,
		0,
	);

	const min = categoryStats.length
		? Math.min(...categoryStats.map((s) => s.min))
		: 0;

	const max = categoryStats.length
		? Math.max(...categoryStats.map((s) => s.max))
		: 0;

	const avg = expenseCount > 0 ? total / expenseCount : 0;

	const items = categories.map((category) => {
		const categoryStat = statsById.get(
			category._id.toString(),
		);

		const categoryTotal = categoryStat?.total ?? 0;

		return {
			...category,
			stats: {
				total: categoryTotal,
				count: categoryStat?.expenseCount ?? 0,
				expenseCount: categoryStat?.expenseCount ?? 0,
				min: categoryStat?.min ?? 0,
				max: categoryStat?.max ?? 0,
				avg: categoryStat?.avg ?? 0,
				pct:
					total > 0
						? Math.round((categoryTotal / total) * 100)
						: 0,
			},
		};
	});

	const stats = {
		total,
		count: categories.length,
		expenseCount,
		min,
		max,
		avg,
	};

	return {
		items,
		stats,
	};
}

export async function updateCategory(
	categoryId: string,
	bucketId: string,
	data: {
		name: string;
		color: string;
		emoji?: string;
		bucketId?: string;
	},
) {
	if (!Types.ObjectId.isValid(categoryId)) {
		return null;
	}

	return CategoryModel.findOneAndUpdate(
		{ _id: categoryId, bucketId },
		data,
		{ new: true, lean: true },
	);
}

export async function getCategoryById(
	categoryId: string,
	bucketId?: string | null,
) {
	if (!Types.ObjectId.isValid(categoryId)) {
		return null;
	}

	return CategoryModel.findOne({
		_id: categoryId,
		...(bucketId
			? { bucketId: new Types.ObjectId(bucketId) }
			: {}),
	}).lean();
}

export async function deleteCategory(
	categoryId: string,
	bucketId: string,
) {
	if (!Types.ObjectId.isValid(categoryId)) {
		return null;
	}
	const hasExpenses = await ExpenseModel.exists({
		bucketId,
		categoryId,
	});

	if (hasExpenses) {
		throw new AppError(
			"Cannot delete category with existing expenses. Reassign or delete expenses first.",
			400,
			"HAS_EXPENSES",
		);
	}

	return CategoryModel.findOneAndDelete({
		_id: categoryId,
		bucketId,
	}).lean();
}

export async function listCategoryIds(
	query: Record<string, unknown>,
): Promise<Types.ObjectId[]> {
	const docs = await CategoryModel.find(query)
		.select("_id")
		.lean();
	return docs.map((d) => d._id as Types.ObjectId);
}

export async function searchCategories(
	userId: string,
	request: CategorySearchRequest,
): Promise<SearchResult<CategoryItem>> {
	const { query, sort, skip, limit } =
		await buildCategoryQuery(userId, request);

	const [items, total] = await Promise.all([
		CategoryModel.find(query)
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.lean(),
		CategoryModel.countDocuments(query),
	]);

	return {
		items: items.map((item) => ({
			_id: (item._id as Types.ObjectId).toString(),
			name: item.name,
			color: item.color,
			emoji: item.emoji,
			userId: (
				item.userId as Types.ObjectId | undefined
			)?.toString(),
			bucketId: (
				item.bucketId as Types.ObjectId | undefined
			)?.toString(),
		})),
		total,
		page: request.pagination.page,
		totalPages:
			Math.ceil(total / request.pagination.pageSize) || 1,
	};
}
