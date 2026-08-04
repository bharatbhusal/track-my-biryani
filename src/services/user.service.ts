import { AppError } from "@/lib/errors";
import { clearAuthCookie } from "@/lib/auth";
import { findUserById } from "@/repositories/user.repository";
import { logAuditEvent } from "@/services/audit.service";

export async function getCurrentUserService(userId: string) {
	const user = await findUserById(userId);
	if (!user) {
		throw new AppError("User not found", 404, "NOT_FOUND");
	}
	return {
		id: user._id.toString(),
		name: user.name,
		username: user.username,
	};
}

export async function logoutUserService(userId: string) {
	await clearAuthCookie();
	await logAuditEvent({
		actorId: userId,
		action: "logout",
		entity: "auth",
		note: "Logged out",
	});
	return { message: "Logged out" };
}
