import {
	comparePassword,
	getAuthPayload,
	hashPassword,
} from "@/lib/auth";
import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { settingsSchema } from "@/lib/validators";
import {
	findUserByEmail,
	updateUserPassword,
	updateUserSettings,
} from "@/repositories/user.repository";
import { logAuditEvent } from "@/services/audit.service";

export async function PATCH(request: Request) {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();
		const payload = settingsSchema.parse(
			await request.json(),
		);

		const updated = await updateUserSettings(auth.userId, {
			theme: payload.theme,
			hapticFeedback: payload.hapticFeedback,
		});

		if (!updated) {
			throw new AppError("User not found", 404, "NOT_FOUND");
		}

		if (payload.password) {
			const user = await findUserByEmail(auth.email);
			if (!user?.password) {
				throw new AppError("User not found", 404, "NOT_FOUND");
			}

			const isMatch = await comparePassword(
				payload.password.currentPassword,
				user.password,
			);
			if (!isMatch) {
				throw new AppError(
					"Current password is incorrect",
					400,
					"INVALID_PASSWORD",
				);
			}

			const newHash = await hashPassword(
				payload.password.newPassword,
			);
			await updateUserPassword(auth.userId, newHash);
		}

		await logAuditEvent({
			userId: auth.userId,
			action: "settings_update",
			entityType: "settings",
		});

		return successResponse({ message: "Settings updated" });
	} catch (error) {
		return errorResponse(error);
	}
}
