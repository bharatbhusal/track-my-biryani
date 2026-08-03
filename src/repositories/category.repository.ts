import { Types } from "mongoose";

import { CategoryModel } from "@/models/Category";
import { ExpenseModel } from "@/models/Expense";
import { AppError } from "@/lib/errors";

export async function createCategory(data: {
	userId: string;
	name: string;
	color: string;
	emoji?: string;
	bucketId?: string | null;
}) {
	const category = await CategoryModel.create({
		...data,
		bucketId: data.bucketId ?? null,
	});
	return category.toObject();
}

export async function ensureCategoryInBucket(
	userId: string,
	bucketId: string | Types.ObjectId | null,
	data: { name: string; color: string; emoji?: string },
) {
	const isShared =
		Boolean(bucketId) &&
		(bucketId instanceof Types.ObjectId ||
			Types.ObjectId.isValid(bucketId as string));
	const filter = isShared
		? {
				bucketId: new Types.ObjectId(bucketId as string),
				name: data.name,
			}
		: { userId, bucketId: null, name: data.name };

	const existing = await CategoryModel.findOne(filter).lean();
	if (existing) {
		return existing;
	}

	try {
		const category = await CategoryModel.create({
			userId,
			bucketId: isShared
				? new Types.ObjectId(bucketId as string)
				: null,
			name: data.name,
			color: data.color,
			emoji: data.emoji,
		});
		return category.toObject();
	} catch (error) {
		// ponytail: concurrent create loses the race → re-find the winner
		const refound = await CategoryModel.findOne(filter).lean();
		if (refound) {
			return refound;
		}
		throw error;
	}
}

export async function listCategories(
	userId: string,
	bucketId: string | null,
) {
	return CategoryModel.find(
		bucketId ? { bucketId } : { userId, bucketId: null },
	)
		.sort({ createdAt: -1 })
		.lean();
}

export async function listCategoriesWithStats(
	userId: string,
	bucketId: string | null,
	from: Date,
	to: Date,
) {
	const match: Record<string, unknown> = bucketId
		? {
				bucketId: new Types.ObjectId(bucketId),
				paidAt: { $gte: from, $lte: to },
			}
		: {
				userId: new Types.ObjectId(userId),
				bucketId: null,
				paidAt: { $gte: from, $lte: to },
			};

	const categoryStats = await ExpenseModel.aggregate([
		{ $match: match },
		{
			$group: {
				_id: "$categoryId",
				total: { $sum: "$amount" },
				count: { $sum: 1 },
				min: { $min: "$amount" },
				max: { $max: "$amount" },
				avg: { $avg: "$amount" },
			},
		},
	]);

	const categories = await CategoryModel.find(
		bucketId ? { bucketId } : { userId, bucketId: null },
	).lean();

	const statsById = new Map(
		categoryStats.map((s) => [s._id.toString(), s]),
	);

	const totalSum = categoryStats.reduce(
		(acc, s) => acc + s.total,
		0,
	);

	return categories.map((cat) => {
		const stats = statsById.get(cat._id.toString());
		const total = stats?.total ?? 0;
		return {
			...cat,
			total,
			count: stats?.count ?? 0,
			min: stats?.min ?? 0,
			max: stats?.max ?? 0,
			avg: stats?.avg ?? 0,
			pct:
				totalSum > 0 ? Math.round((total / totalSum) * 100) : 0,
		};
	});
}

export async function updateCategory(
	userId: string,
	categoryId: string,
	bucketId: string | null,
	data: { name: string; color: string; emoji?: string },
) {
	if (!Types.ObjectId.isValid(categoryId)) {
		return null;
	}

	return CategoryModel.findOneAndUpdate(
		bucketId
			? { _id: categoryId, bucketId }
			: { _id: categoryId, userId, bucketId: null },
		data,
		{ new: true, lean: true },
	);
}

export async function getCategoryById(
	userId: string,
	categoryId: string,
	bucketId: string | null,
) {
	if (!Types.ObjectId.isValid(categoryId)) {
		return null;
	}

	return CategoryModel.findOne(
		bucketId
			? { _id: categoryId, bucketId }
			: { _id: categoryId, userId, bucketId: null },
	).lean();
}

export async function deleteCategory(
	userId: string,
	categoryId: string,
	bucketId: string | null,
) {
	if (!Types.ObjectId.isValid(categoryId)) {
		return null;
	}
	const hasExpenses = await ExpenseModel.exists(
		bucketId
			? { bucketId, categoryId }
			: { userId, bucketId: null, categoryId },
	);

	if (hasExpenses) {
		throw new AppError(
			"Cannot delete category with existing expenses. Reassign or delete expenses first.",
			400,
			"HAS_EXPENSES",
		);
	}

	return CategoryModel.findOneAndDelete(
		bucketId
			? { _id: categoryId, bucketId }
			: { _id: categoryId, userId, bucketId: null },
	).lean();
}
