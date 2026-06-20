import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import {
	expenseFiltersSchema,
	expenseSchema,
} from "@/lib/validators";
import {
	createExpense,
	listExpenses,
} from "@/repositories/expense.repository";
import { logAuditEvent } from "@/services/audit.service";
import { findUserById } from "@/repositories/user.repository";
import { AppError } from "@/lib/errors";

export async function GET(request: NextRequest) {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();
		const filters = expenseFiltersSchema.parse(
			Object.fromEntries(
				request.nextUrl.searchParams.entries(),
			),
		);
		const expenses = await listExpenses(auth.userId, filters);

		return successResponse(expenses);
	} catch (error) {
		return errorResponse(error);
	}
}

export async function POST(request: NextRequest) {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();
		const payload = expenseSchema.parse(await request.json());

		const existing = await findUserById(auth.userId);
		if (!existing) {
			throw new AppError(
				"User doesn't exist",
				409,
				"USER_DOESN'T_EXIST",
			);
		}

		const expense = await createExpense({
			userId: auth.userId,
			title: payload.title,
			amount: payload.amount,
			categoryId: payload.categoryId,
			notes: payload.notes,
			images: payload.images,
			location: payload.location,
			currency: payload.currency,
			paidAt: payload?.paidAt
				? new Date(payload.paidAt)
				: undefined,
		});

		await logAuditEvent({
			userId: auth.userId,
			action: "create",
			entityType: "expense",
			entityId: expense._id.toString(),
			metadata: {
				amount: expense.amount,
			},
		});

		return successResponse(expense, 201);
	} catch (error) {
		return errorResponse(error);
	}
}
