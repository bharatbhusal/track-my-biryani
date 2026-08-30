import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import { searchAuditLogsService } from "@/services/audit.service";

export async function searchAuditLogs(
	request: NextRequest,
) {
	const auth = await getAuthPayload();
	const body = await request.json().catch(() => ({}));
	return searchAuditLogsService(auth.userId, body);
}
