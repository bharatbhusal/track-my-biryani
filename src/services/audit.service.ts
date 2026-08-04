import { createAuditLog, listAuditLogs } from "@/repositories/audit.repository";

export async function logAuditEvent(input: {
	actorId: string;
	bucketId?: string;
	action: string;
	entity: string;
	entityId?: string;
	note?: string;
	metadata?: Record<string, unknown>;
}): Promise<void> {
	await createAuditLog(input);
}

export async function listAuditLogsService(
	userId: string,
	bucketId?: string,
	page = 1,
	limit = 30,
	sortBy: "timestamp" | "action" | "entity" = "timestamp",
	order: "asc" | "desc" = "desc",
) {
	return listAuditLogs(userId, bucketId, page, limit, sortBy, order);
}
