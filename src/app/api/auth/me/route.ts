import { getAuthPayload } from "@/lib/auth";
import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { findUserById } from "@/repositories/user.repository";

export async function GET() {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();
		const user = await findUserById(auth.userId);

		if (!user) {
			throw new AppError("User not found", 404, "NOT_FOUND");
		}

		return successResponse({
			id: user._id.toString(),
			name: user.name,
			username: user.username,
		});
	} catch (error) {
		return errorResponse(error);
	}
}
