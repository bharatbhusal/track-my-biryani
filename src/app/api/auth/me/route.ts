import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/controllers/user.controller";

export async function GET() {
	try {
		await connectToDatabase();
		const data = await getCurrentUser();
		return successResponse(data);
	} catch (error) {
		return errorResponse(error);
	}
}
