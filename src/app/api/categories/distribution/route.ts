import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { getCategoryDistribution } from "@/controllers/category.controller";

export async function GET(request: NextRequest) {
	try {
		await connectToDatabase();
		const data = await getCategoryDistribution(request);
		return successResponse(data);
	} catch (error) {
		return errorResponse(error);
	}
}
