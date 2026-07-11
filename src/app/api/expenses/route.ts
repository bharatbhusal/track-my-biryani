import { NextRequest } from "next/server";

import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import {
	createExpense,
	listExpenses,
} from "@/controllers/expense.controller";

export async function GET(request: NextRequest) {
	try {
		await connectToDatabase();
		const data = await listExpenses(request);
		return successResponse(data);
	} catch (error) {
		return errorResponse(error);
	}
}

export async function POST(request: NextRequest) {
	try {
		await connectToDatabase();
		const data = await createExpense(request);
		return successResponse(data, 201);
	} catch (error) {
		return errorResponse(error);
	}
}
