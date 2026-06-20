import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { categorySchema } from "@/lib/validators";
import {
	createCategory,
	listCategories,
} from "@/repositories/category.repository";
import { randomHexColor } from "@/lib/utils";
import { logAuditEvent } from "@/services/audit.service";
import { findUserById } from "@/repositories/user.repository";
import { AppError } from "@/lib/errors";

export async function GET() {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();
		const categories = await listCategories(auth.userId);
		return successResponse(categories);
	} catch (error) {
		return errorResponse(error);
	}
}

export async function POST(request: NextRequest) {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();
		const payload = categorySchema.parse(
			await request.json(),
		);

		const existing = await findUserById(auth.userId);
		if (!existing) {
			throw new AppError(
				"User doesn't exist",
				409,
				"USER_DOESN'T_EXIST",
			);
		}

		const category = await createCategory({
			userId: auth.userId,
			name: payload.name,
			color: payload.color ?? randomHexColor(),
			emoji: payload.emoji,
		});

		await logAuditEvent({
			userId: auth.userId,
			action: "create",
			entityType: "category",
			entityId: category._id.toString(),
			metadata: { name: category.name },
		});

		return successResponse(category, 201);
	} catch (error) {
		return errorResponse(error);
	}
}
