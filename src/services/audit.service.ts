import { auditSearchSchema } from "@/lib/validators";
import {
	createAuditLog,
	searchAuditLogs,
} from "@/repositories/audit.repository";
import type { AuditSearchRequest } from "@/types/search.types";

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

function defaultAuditSearchRequest(): AuditSearchRequest {
	return {
		filterCriteria: {
			bucketPreset: "ALL",
			bucketIds: [],
			ownerPreset: "ALL",
			ownerIds: [],
			datePreset: "THIS_MONTH",
		},
		sortCriteria: { field: "timestamp", direction: "DESC" },
		pagination: { page: 1, pageSize: 30 },
	};
}

export async function searchAuditLogsService(
	userId: string,
	searchRequest: unknown,
) {
	const parsed = auditSearchSchema.parse(
		searchRequest ?? {},
	);
	const defaults = defaultAuditSearchRequest();
	return searchAuditLogs(userId, {
		filterCriteria:
			parsed.filterCriteria ?? defaults.filterCriteria,
		sortCriteria:
			parsed.sortCriteria ?? defaults.sortCriteria,
		pagination: parsed.pagination ?? defaults.pagination,
	});
}
