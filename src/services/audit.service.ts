import { createAuditLog, listAuditLogs } from "@/repositories/audit.repository";

export async function logAuditEvent(input: {
	userId: string;
	action: string;
	entityType: string;
	entityId?: string;
	metadata?: Record<string, unknown>;
}): Promise<void> {
	await createAuditLog(input);
}

export async function listAuditLogsService(
	userId: string,
	page: number,
	limit: number,
	action?: string,
	from?: Date,
	to?: Date,
) {
	return listAuditLogs(userId, page, limit, action, from, to);
}
