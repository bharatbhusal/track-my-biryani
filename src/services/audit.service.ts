import { createAuditLog } from '@/repositories/audit.repository';

export async function logAuditEvent(input: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await createAuditLog(input);
}
