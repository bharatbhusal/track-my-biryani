import { Types } from "mongoose";

import { CategoryModel } from "@/models/Category";
import { ExpenseModel } from "@/models/Expense";
import { AppError } from "@/lib/errors";

export async function createCategory(data: {
	userId: string;
	name: string;
	color: string;
	emoji?: string;
}) {
	const category = await CategoryModel.create(data);
	return category.toObject();
}

export async function listCategories(userId: string) {
	return CategoryModel.find({ userId })
		.sort({ createdAt: -1 })
		.lean();
}

export async function listCategoriesWithStats(
	userId: string,
	from: Date,
	to: Date,
) {
	const match: Record<string, unknown> = {
		userId: new Types.ObjectId(userId),
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

	const categories = await CategoryModel.find({
		userId,
	}).lean();

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
	data: { name: string; color: string; emoji?: string },
) {
	if (!Types.ObjectId.isValid(categoryId)) {
		return null;
	}

	return CategoryModel.findOneAndUpdate(
		{ _id: categoryId, userId },
		data,
		{ new: true, lean: true },
	);
}

export async function getCategoryById(
	userId: string,
	categoryId: string,
) {
	if (!Types.ObjectId.isValid(categoryId)) {
		return null;
	}

	return CategoryModel.findOne({
		_id: categoryId,
		userId,
	}).lean();
}

export async function deleteCategory(
	userId: string,
	categoryId: string,
) {
	if (!Types.ObjectId.isValid(categoryId)) {
		return null;
	}
	const hasExpenses = await ExpenseModel.exists({
		userId,
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
		userId,
	}).lean();
}
