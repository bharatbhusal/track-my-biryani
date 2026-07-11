import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import { listAuditLogsService } from "@/services/audit.service";

export async function listAuditLogs(request: NextRequest) {
	const auth = await getAuthPayload();
	const url = new URL(request.url);
	const page = parseInt(url.searchParams.get("page") ?? "1", 10);
	const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);
	const action = url.searchParams.get("action") ?? undefined;
	const from = url.searchParams.get("from") ?? undefined;
	const to = url.searchParams.get("to") ?? undefined;

	return listAuditLogsService(
		auth.userId,
		page,
		limit,
		action,
		from ? new Date(from) : undefined,
		to ? new Date(to) : undefined,
	);
}
