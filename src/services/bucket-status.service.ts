import { BUCKET_ERRORS, ERROR_CODES } from "@/constants/error-messages";
import type { BucketLifecycleStatus } from "@/constants/types/bucket.types";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/constants/types/audit.types";
import { AppError } from "@/lib/errors";
import {
  findBucketById,
  resolveBucketStatus,
  updateBucketStatus,
} from "@/repositories/bucket.repository";
import { logAuditEvent } from "@/services/audit.service";

export type BucketAction =
  | "expense.create"
  | "expense.update"
  | "expense.delete"
  | "category.create"
  | "category.update"
  | "category.delete"
  | "member.invite"
  | "member.accept"
  | "member.join"
  | "member.leave"
  | "member.revoke"
  | "share.configure"
  | "settlement.confirm"
  | "bucket.close"
  | "bucket.delete"
  | "budget.create"
  | "budget.update"
  | "budget.delete";

export const ACTION_STATUSES: Record<BucketAction, readonly BucketLifecycleStatus[]> = {
  "expense.create": ["live"],
  "expense.update": ["live"],
  "expense.delete": ["live"],
  "category.create": ["live"],
  "category.update": ["live"],
  "category.delete": ["live"],
  "member.invite": ["live"],
  "member.accept": ["live"],
  "member.join": ["live"],
  "member.leave": ["live"],
  "member.revoke": ["live"],
  "share.configure": ["settlement-config"],
  "settlement.confirm": ["settlement-live"],
  "bucket.close": ["settlement-live"],
  "bucket.delete": ["live"],
  // blocked only on close
  "budget.create": ["live", "settlement-config", "settlement-live"],
  "budget.update": ["live", "settlement-config", "settlement-live"],
  "budget.delete": ["live", "settlement-config", "settlement-live"],
};

export const BUCKET_TRANSITIONS: Record<BucketLifecycleStatus, readonly BucketLifecycleStatus[]> = {
  live: ["settlement-config"],
  "settlement-config": ["settlement-live", "live"], // revert allowed before anything is paid
  "settlement-live": [],
  close: [],
};

export function assertActionAllowed(
  bucket: { status?: BucketLifecycleStatus; closedAt?: Date },
  action: BucketAction,
): void {
  const current = resolveBucketStatus(bucket);
  if (!ACTION_STATUSES[action].includes(current)) {
    throw new AppError(
      BUCKET_ERRORS.ACTION_NOT_ALLOWED_IN_STATUS(action, current),
      403,
      ERROR_CODES.ACTION_NOT_ALLOWED_IN_STATUS,
    );
  }
}

export async function transitionBucketStatus(
  userId: string,
  bucketId: string,
  target: "settlement-config" | "settlement-live",
): Promise<{ success: true; status: BucketLifecycleStatus }> {
  const bucket = await findBucketById(bucketId);
  if (!bucket) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  const isOwner = bucket.members.some(
    (member) => member.userId.toString() === userId && member.role === "owner",
  );
  if (!isOwner) {
    throw new AppError(BUCKET_ERRORS.OWNER_ONLY, 403, ERROR_CODES.OWNER_ONLY);
  }

  if (bucket.isPersonal) {
    throw new AppError(
      BUCKET_ERRORS.PERSONAL_ACTION_NOT_ALLOWED,
      400,
      ERROR_CODES.BUCKET_IS_PERSONAL,
    );
  }

  const from = resolveBucketStatus(bucket);
  if (!BUCKET_TRANSITIONS[from].includes(target)) {
    throw new AppError(
      BUCKET_ERRORS.INVALID_BUCKET_TRANSITION(from, target),
      400,
      ERROR_CODES.INVALID_BUCKET_TRANSITION,
    );
  }

  if (target === "settlement-live") {
    const shares = bucket.shareConfiguration;
    const values =
      shares instanceof Map ? Array.from(shares.values()) : Object.values(shares ?? {});
    const sum = values.reduce((acc, value) => acc + value, 0);
    if (Math.abs(sum - 100) > 0.001) {
      throw new AppError(
        BUCKET_ERRORS.SHARE_CONFIGURATION_REQUIRED,
        400,
        ERROR_CODES.SHARE_CONFIGURATION_REQUIRED,
      );
    }
  }

  const updated = await updateBucketStatus(bucketId, target);
  if (!updated) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  await logAuditEvent({
    actorId: userId,
    bucketId,
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.BUCKET,
    note: `Moved bucket "${bucket.name}" from ${from} to ${target}`,
  });

  return { success: true, status: target };
}
