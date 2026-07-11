import { NextRequest } from "next/server";

import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import {
	createCategory,
	listCategories,
} from "@/controllers/category.controller";

export async function GET() {
	try {
		await connectToDatabase();
		const data = await listCategories();
		return successResponse(data);
	} catch (error) {
		return errorResponse(error);
	}
}

export async function POST(request: NextRequest) {
	try {
		await connectToDatabase();
		const data = await createCategory(request);
		return successResponse(data, 201);
	} catch (error) {
		return errorResponse(error);
	}
}
