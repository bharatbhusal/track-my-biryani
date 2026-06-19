import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { connectToDatabase } from "@/lib/db";
import { getExpenseContribution } from "@/repositories/expense.repository";

export async function GET(request: NextRequest) {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();

		const segments = request.nextUrl.pathname
			.split("/")
			.filter(Boolean);
		const expensesIndex = segments.indexOf("expenses");
		const id =
			expensesIndex >= 0 && segments.length > expensesIndex + 1
				? segments[expensesIndex + 1]
				: null;

		if (!id) {
			return errorResponse(
				new AppError("Missing expense id", 400),
			);
		}

		const from = request.nextUrl.searchParams.get("from");
		const to = request.nextUrl.searchParams.get("to");
		const data = await getExpenseContribution(
			auth.userId,
			id,
			from ? new Date(from) : undefined,
			to ? new Date(to) : undefined,
		);
		if (!data) {
			return errorResponse(
				new AppError("Expense not found", 404),
			);
		}

		return successResponse(data);
	} catch (error) {
		return errorResponse(error);
	}
}
