import { NextRequest } from "next/server";

import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { listAuditLogs } from "@/controllers/audit.controller";

export async function GET(request: NextRequest) {
	try {
		await connectToDatabase();
		const data = await listAuditLogs(request);
		return successResponse(data);
	} catch (error) {
		return errorResponse(error);
	}
}
