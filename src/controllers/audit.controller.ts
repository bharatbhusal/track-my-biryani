import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import { getBucketId, resolveBucketContext } from "@/lib/bucket";
import { listAuditLogsService } from "@/services/audit.service";

export async function listAuditLogs(request: NextRequest) {
	const auth = await getAuthPayload();
	const url = new URL(request.url);
	const page = parseInt(url.searchParams.get("page") ?? "1", 10);
	const limit = parseInt(url.searchParams.get("limit") ?? "30", 10);
	const sortBy = url.searchParams.get("sortBy") ?? "timestamp";
	const order = url.searchParams.get("order") ?? "desc";

	const bucketId = getBucketId(request);
	const ctx = await resolveBucketContext(auth.userId, bucketId);

	return listAuditLogsService(
		auth.userId,
		ctx.bucketId,
		page,
		limit,
		sortBy as "timestamp" | "action" | "entity",
		order as "asc" | "desc",
	);
}
