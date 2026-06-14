import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { connectToDatabase } from "@/lib/db";
import { getCategoryRangeStats } from "@/repositories/expense.repository";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();
		const { id } = await params;
		const url = new URL(request.url);
		const from = url.searchParams.get("from");
		const to = url.searchParams.get("to");

		if (!from || !to) {
			return errorResponse(
				new AppError("from and to query params are required", 400),
			);
		}

		const data = await getCategoryRangeStats(
			auth.userId,
			id,
			new Date(from),
			new Date(to),
		);

		return successResponse(data);
	} catch (error) {
		return errorResponse(error);
	}
}
