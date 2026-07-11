import { NextRequest } from "next/server";

import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import {
	deleteCategory,
	getCategory,
	updateCategory,
} from "@/controllers/category.controller";

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		await connectToDatabase();
		const data = await getCategory(request, context);
		return successResponse(data);
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
		const data = await updateCategory(request, context);
		return successResponse(data);
	} catch (error) {
		return errorResponse(error);
	}
}

export async function DELETE(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		await connectToDatabase();
		const data = await deleteCategory(request, context);
		return successResponse(data);
	} catch (error) {
		return errorResponse(error);
	}
}
