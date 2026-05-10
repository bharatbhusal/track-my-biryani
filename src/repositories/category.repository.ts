import { Types } from "mongoose";

import { CategoryModel } from "@/models/Category";

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

	return CategoryModel.findOneAndDelete({
		_id: categoryId,
		userId,
	}).lean();
}
