import { getAuthPayload } from "@/lib/auth";
import {
	getCurrentUserService,
	logoutUserService,
} from "@/services/user.service";

export async function getCurrentUser() {
	const auth = await getAuthPayload();
	return getCurrentUserService(auth.userId);
}

export async function logoutUser() {
	const auth = await getAuthPayload();
	return logoutUserService(auth.userId);
}
