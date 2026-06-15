import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { randomHexColor } from "@/lib/utils";
import { categorySchema } from "@/lib/validators";
import {
	deleteCategory,
	getCategoryById,
	updateCategory,
} from "@/repositories/category.repository";
import { logAuditEvent } from "@/services/audit.service";

export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();
		const { id } = await context.params;

		const category = await getCategoryById(auth.userId, id);
		if (!category) {
			throw new AppError(
				"Category not found",
				404,
				"NOT_FOUND",
			);
		}

		return successResponse(category);
	} catch (error) {
		return errorResponse(error);
	}
}

export async function PUT(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();
		const payload = categorySchema.parse(
			await request.json(),
		);
		const { id } = await context.params;

		const category = await updateCategory(auth.userId, id, {
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
			userId: auth.userId,
			action: "update",
			entityType: "category",
			entityId: category._id.toString(),
		});

		return successResponse(category);
	} catch (error) {
		return errorResponse(error);
	}
}

export async function DELETE(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();
		const { id } = await context.params;
		const deleted = await deleteCategory(auth.userId, id);
		if (!deleted) {
			throw new AppError(
				"Category not found",
				404,
				"NOT_FOUND",
			);
		}

		await logAuditEvent({
			userId: auth.userId,
			action: "delete",
			entityType: "category",
			entityId: id,
		});

		return successResponse({ message: "Category deleted" });
	} catch (error) {
		return errorResponse(error);
	}
}
