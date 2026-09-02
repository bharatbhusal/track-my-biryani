import { auditSearchSchema } from "@/lib/validators";
import { createAuditLog, searchAuditLogs } from "@/repositories/audit.repository";
import type { AuditSearchRequest } from "@/constants/types/search.types";
import { AuditLogType } from "@/constants/types/audit.types";

export async function logAuditEvent(input: AuditLogType): Promise<void> {
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

export async function searchAuditLogsService(userId: string, searchRequest: unknown) {
  const parsed = auditSearchSchema.parse(searchRequest ?? {});
  const defaults = defaultAuditSearchRequest();
  return searchAuditLogs(userId, {
    filterCriteria: parsed.filterCriteria ?? defaults.filterCriteria,
    sortCriteria: parsed.sortCriteria ?? defaults.sortCriteria,
    pagination: parsed.pagination ?? defaults.pagination,
  });
}
