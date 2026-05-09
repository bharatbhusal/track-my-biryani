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

		const expense = await createExpense({
			userId: auth.userId,
			title: payload.title,
			amount: payload.amount,
			categoryId: payload.categoryId,
			notes: payload.notes,
			paymentMethod: payload.paymentMethod,
			tags: payload.tags,
			images: payload.images,
			location: payload.location,
			currency: payload.currency,
			dateTime: new Date(payload.dateTime),
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
