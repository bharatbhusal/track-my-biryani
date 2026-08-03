import { NextRequest } from "next/server";

import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import {
	deleteBucket,
	getBucket,
	updateBucket,
} from "@/controllers/bucket.controller";

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		await connectToDatabase();
		const data = await getBucket(request, context);
		return successResponse(data);
	} catch (error) {
		return errorResponse(error);
	}
}

export async function PATCH(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		await connectToDatabase();
		const data = await updateBucket(request, context);
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
		const data = await deleteBucket(request, context);
		return successResponse(data);
	} catch (error) {
		return errorResponse(error);
	}
}
