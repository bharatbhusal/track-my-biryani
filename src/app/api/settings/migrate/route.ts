import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { runMigration } from "@/controllers/bucket.controller";

export async function POST() {
	try {
		await connectToDatabase();
		const data = await runMigration();
		return successResponse(data);
	} catch (error) {
		return errorResponse(error);
	}
}
