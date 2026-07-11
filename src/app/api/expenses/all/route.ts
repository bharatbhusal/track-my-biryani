import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { listExpensesForRange } from "@/repositories/expense.repository";

export async function GET(request: NextRequest) {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();
		const from = request.nextUrl.searchParams.get("from");
		const to = request.nextUrl.searchParams.get("to");

		if (!from || !to) {
			return errorResponse(
				new Error("from and to query params are required"),
			);
		}

		const expenses = await listExpensesForRange(
			auth.userId,
			new Date(from),
			new Date(to),
		);

		return successResponse(expenses);
	} catch (error) {
		return errorResponse(error);
	}
}
