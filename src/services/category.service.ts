import { AppError } from "@/lib/errors";
import { resolveBucketContext } from "@/lib/bucket";
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

async function assertCategoryCreator(
	userId: string,
	categoryId: string,
	bucketId: string,
) {
	const category = await getCategoryById(
		userId,
		categoryId,
		bucketId,
	);
	if (!category) {
		throw new AppError(
			"Category not found",
			404,
			"NOT_FOUND",
		);
	}
	if (category.userId.toString() !== userId) {
		throw new AppError(
			"Only the category creator can manage this category",
			403,
			"NOT_OWNER",
		);
	}
}

export async function listCategoriesService(
	userId: string,
	bucketId?: string | null,
) {
	const ctx = await resolveBucketContext(userId, bucketId);
	return listCategories(userId, ctx.bucketId);
}

export async function listCategoriesWithStatsService(
	userId: string,
	bucketId: string | null | undefined,
	from: string,
	to: string,
) {
	if (!from || !to) {
		throw new AppError(
			"from and to query params are required",
			400,
		);
	}
	const ctx = await resolveBucketContext(userId, bucketId);
	return listCategoriesWithStats(
		userId,
		ctx.bucketId,
		new Date(from),
		new Date(to),
	);
}

export async function createCategoryService(
	userId: string,
	bucketId: string | null | undefined,
	body: unknown,
) {
	const payload = categorySchema.parse(body);
	const ctx = await resolveBucketContext(userId, bucketId);

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
		bucketId: ctx.bucketId,
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
	bucketId?: string | null,
) {
	const ctx = await resolveBucketContext(userId, bucketId);
	const category = await getCategoryById(
		userId,
		categoryId,
		ctx.bucketId,
	);
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
	bucketId: string | null | undefined,
	categoryId: string,
	body: unknown,
) {
	const payload = categorySchema.parse(body);
	const ctx = await resolveBucketContext(userId, bucketId);
	await assertCategoryCreator(
		userId,
		categoryId,
		ctx.bucketId,
	);

	const targetBucketId = payload.bucketId ?? ctx.bucketId;
	if (targetBucketId !== ctx.bucketId) {
		await resolveBucketContext(userId, targetBucketId);
	}

	const category = await updateCategory(
		userId,
		categoryId,
		ctx.bucketId,
		{
			name: payload.name,
			color: payload.color ?? randomHexColor(),
			emoji: payload.emoji,
			bucketId: targetBucketId,
		},
	);

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
	bucketId: string | null | undefined,
	categoryId: string,
) {
	const ctx = await resolveBucketContext(userId, bucketId);
	await assertCategoryCreator(
		userId,
		categoryId,
		ctx.bucketId,
	);

	const deleted = await deleteCategory(
		userId,
		categoryId,
		ctx.bucketId,
	);
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
	bucketId?: string | null,
) {
	if (!from || !to) {
		throw new AppError(
			"from and to query params are required",
			400,
		);
	}
	const ctx = await resolveBucketContext(userId, bucketId);
	return getCategoryRangeStats(
		userId,
		categoryId,
		new Date(from),
		new Date(to),
		ctx.bucketId,
	);
}

export async function getCategoryDistributionService(
	userId: string,
	from: string,
	to: string,
	bucketId?: string | null,
) {
	if (!from || !to) {
		throw new AppError(
			"from and to query params are required",
			400,
		);
	}
	const ctx = await resolveBucketContext(userId, bucketId);
	return getCategoryDistribution(
		userId,
		new Date(from),
		new Date(to),
		ctx.bucketId,
	);
}
