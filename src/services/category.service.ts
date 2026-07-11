import { AppError } from "@/lib/errors";
import { categorySchema } from "@/lib/validators";
import {
	createCategory,
	deleteCategory,
	getCategoryById,
	listCategories,
	listCategoriesWithStats,
	updateCategory,
} from "@/repositories/category.repository";
import {
	getCategoryRangeStats,
	getCategoryDistribution,
} from "@/repositories/expense.repository";
import { findUserById } from "@/repositories/user.repository";
import { logAuditEvent } from "@/services/audit.service";
import { randomHexColor } from "@/lib/utils";

export async function listCategoriesService(userId: string) {
	return listCategories(userId);
}

export async function listCategoriesWithStatsService(
	userId: string,
	from: string,
	to: string,
) {
	if (!from || !to) {
		throw new AppError(
			"from and to query params are required",
			400,
		);
	}
	return listCategoriesWithStats(userId, new Date(from), new Date(to));
}

export async function createCategoryService(
	userId: string,
	body: unknown,
) {
	const payload = categorySchema.parse(body);

	const existing = await findUserById(userId);
	if (!existing) {
		throw new AppError(
			"User doesn't exist",
			409,
			"USER_DOESN'T_EXIST",
		);
	}

	const category = await createCategory({
		userId,
		name: payload.name,
		color: payload.color ?? randomHexColor(),
		emoji: payload.emoji,
	});

	await logAuditEvent({
		userId,
		action: "create",
		entityType: "category",
		entityId: category._id.toString(),
		metadata: { name: category.name },
	});

	return category;
}

export async function getCategoryService(
	userId: string,
	categoryId: string,
) {
	const category = await getCategoryById(userId, categoryId);
	if (!category) {
		throw new AppError(
			"Category not found",
			404,
			"NOT_FOUND",
		);
	}
	return category;
}

export async function updateCategoryService(
	userId: string,
	categoryId: string,
	body: unknown,
) {
	const payload = categorySchema.parse(body);
	const category = await updateCategory(userId, categoryId, {
		name: payload.name,
		color: payload.color ?? randomHexColor(),
		emoji: payload.emoji,
	});

	if (!category) {
		throw new AppError(
			"Category not found",
			404,
			"NOT_FOUND",
		);
	}

	await logAuditEvent({
		userId,
		action: "update",
		entityType: "category",
		entityId: category._id.toString(),
	});

	return category;
}

export async function deleteCategoryService(
	userId: string,
	categoryId: string,
) {
	const deleted = await deleteCategory(userId, categoryId);
	if (!deleted) {
		throw new AppError(
			"Category not found",
			404,
			"NOT_FOUND",
		);
	}

	await logAuditEvent({
		userId,
		action: "delete",
		entityType: "category",
		entityId: categoryId,
	});

	return { message: "Category deleted" };
}

export async function getCategoryStatsService(
	userId: string,
	categoryId: string,
	from: string,
	to: string,
) {
	if (!from || !to) {
		throw new AppError(
			"from and to query params are required",
			400,
		);
	}
	return getCategoryRangeStats(
		userId,
		categoryId,
		new Date(from),
		new Date(to),
	);
}

export async function getCategoryDistributionService(
	userId: string,
	from: string,
	to: string,
) {
	if (!from || !to) {
		throw new AppError(
			"from and to query params are required",
			400,
		);
	}
	return getCategoryDistribution(userId, new Date(from), new Date(to));
}
