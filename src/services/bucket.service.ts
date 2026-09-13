import { AppError } from "@/lib/errors";
import { BUCKET_ERRORS, ERROR_CODES, USER_ERRORS } from "@/constants/error-messages";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { buildBucketStatsExpenseMatch } from "@/lib/query-builders";
import {
  bucketSchema,
  bucketSearchSchema,
  bucketStatsSchema,
  inviteSchema,
} from "@/lib/validators";
import bucketRepository, {
  type BucketDoc,
  type BucketMemberDoc,
} from "@/repositories/bucket.repository";
import {
  ensureCategoryInBucket,
  deleteCategoriesByBucket,
} from "@/repositories/category.repository";
import userRepository from "@/repositories/user.repository";
import expenseRepository from "@/repositories/expense.repository";
import settlementRepository, { type SettlementDoc } from "@/repositories/settlement.repository";
import { computeSettlement, findOutstandingDebt } from "@/lib/settle";
import { logAuditEvent } from "@/services/audit.service";
import type {
  BucketBalances,
  BucketDetail,
  BucketPreview,
  BucketSummary,
  BucketsListPayload,
  DebtEdge,
  IncomingRequestsGroup,
  MemberBalance,
  SettlementItem,
} from "@/constants/types/bucket.types";
import type { BucketSearchRequest, ExpenseFilterCriteria } from "@/constants/types/search.types";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/constants/types/audit.types";

function toPercentageMap(config: BucketDoc["shareConfiguration"]): Map<string, number> {
  const map = new Map<string, number>();
  if (!config) return map;
  if (config instanceof Map) {
    config.forEach((pct, uid) => map.set(uid, pct));
  } else {
    for (const [uid, pct] of Object.entries(config)) {
      map.set(uid, pct);
    }
  }
  return map;
}

async function listBuckets(userId: string): Promise<BucketsListPayload> {
  const [accepted, invitations] = await Promise.all([
    bucketRepository.listBucketsForMember(userId),
    bucketRepository.listBucketsForPendingMember(userId),
  ]);

  return {
    items: accepted.map((bucket) => toSummary(bucket, userId)),
    invitations: invitations.map((bucket) => toSummary(bucket, userId)),
  };
}

async function createBucket(userId: string, body: unknown): Promise<BucketDetail> {
  const payload = bucketSchema.parse(body);

  const bucket = await bucketRepository.createBucket({
    name: payload.name,
    icon: payload.icon,
    ownerId: userId,
    members: [
      {
        userId,
        role: "owner",
        status: "accepted",
        joinedAt: new Date(),
      },
    ],
  });

  for (const category of DEFAULT_CATEGORIES) {
    await ensureCategoryInBucket(userId, bucket._id.toString(), category);
  }

  await logAuditEvent({
    actorId: userId,
    bucketId: bucket._id.toString(),
    action: AUDIT_ACTIONS.CREATE,
    entity: AUDIT_ENTITIES.BUCKET,
    entityId: bucket._id.toString(),
    note: `Created bucket "${bucket.name}"`,
  });

  return toDetail(bucket);
}

async function getBucketStats(
  userId: string,
  bucketId: string,
  body: unknown,
): Promise<BucketDetail> {
  const parsed = bucketStatsSchema.parse(body ?? {});
  const bucket = await bucketRepository.findBucketById(bucketId);
  if (!bucket) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }
  const member = bucket.members.find((m) => m.userId.toString() === userId);
  if (!member || member.status !== "accepted") {
    throw new AppError(BUCKET_ERRORS.NOT_MEMBER, 403, ERROR_CODES.NOT_A_MEMBER);
  }
  const detail = await toDetail(bucket);
  const criteria = parsed.filterCriteria ?? {};
  const filters: ExpenseFilterCriteria = {
    bucket: { preset: "ALL" },
    category: { preset: "ALL" },
    owner: { preset: "ALL" },
    date: { preset: "THIS_MONTH" },
    ...criteria,
  };
  const expenseMatch = buildBucketStatsExpenseMatch(userId, filters);
  const stats = await bucketRepository.getFilteredBucketExpenseStats(bucketId, expenseMatch);
  return {
    ...detail,
    role: member.role,
    status: member.status,
    totalAmount: stats.total,
    expenseCount: stats.count,
  };
}

async function updateBucket(
  userId: string,
  bucketId: string,
  body: unknown,
): Promise<BucketDetail> {
  const payload = bucketSchema.parse(body);
  await requireOwner(userId, bucketId);
  const bucket = await bucketRepository.updateBucketName(bucketId, {
    name: payload.name,
    icon: payload.icon,
  });
  if (!bucket) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  await logAuditEvent({
    actorId: userId,
    bucketId,
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.BUCKET,
    entityId: bucketId,
    note: `Updated bucket "${payload.name}"`,
  });

  return toDetail(bucket);
}

async function deleteBucket(userId: string, bucketId: string) {
  const bucket = await requireOwner(userId, bucketId);
  const hasExpenses = await bucketRepository.expenseExistsInBucket(bucketId);
  if (hasExpenses) {
    throw new AppError(BUCKET_ERRORS.HAS_EXPENSES, 400, ERROR_CODES.HAS_EXPENSES);
  }

  await deleteCategoriesByBucket(bucketId);
  await bucketRepository.deleteBucket(bucketId);

  await logAuditEvent({
    actorId: userId,
    bucketId,
    action: AUDIT_ACTIONS.DELETE,
    entity: AUDIT_ENTITIES.BUCKET,
    entityId: bucketId,
    note: `Deleted bucket "${bucket.name}"`,
  });

  return { message: "Bucket deleted" };
}

async function inviteUser(userId: string, bucketId: string, body: unknown): Promise<BucketDetail> {
  const payload = inviteSchema.parse(body);
  const bucket = await requireOwner(userId, bucketId);
  if (bucket.closedAt) {
    throw new AppError(BUCKET_ERRORS.BUCKET_CLOSED, 403, ERROR_CODES.BUCKET_CLOSED);
  }

  const user = await userRepository.findUserByUsername(payload.username);
  if (!user) {
    throw new AppError(USER_ERRORS.NOT_FOUND, 404, ERROR_CODES.USER_NOT_FOUND);
  }
  const targetId = user._id.toString();
  if (bucket.members.some((m) => m.userId.toString() === targetId)) {
    throw new AppError(BUCKET_ERRORS.ALREADY_MEMBER_BUCKET, 409, ERROR_CODES.ALREADY_MEMBER);
  }

  const updated = await bucketRepository.addBucketMember(bucketId, {
    userId: targetId,
    role: "member",
    status: "pending",
    invitedBy: userId,
    invitedAt: new Date(),
  });
  if (!updated) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  await logAuditEvent({
    actorId: userId,
    bucketId,
    action: AUDIT_ACTIONS.INVITE,
    entity: AUDIT_ENTITIES.MEMBER,
    entityId: bucketId,
    note: `Invited @${user.username} to ${bucket.name}`,
    metadata: { targetUserId: targetId },
  });

  return toDetail(updated);
}

async function acceptInvite(userId: string, bucketId: string): Promise<BucketDetail> {
  const bucketDoc = await requirePendingMember(userId, bucketId);
  if (bucketDoc.closedAt) {
    throw new AppError(BUCKET_ERRORS.BUCKET_CLOSED, 403, ERROR_CODES.BUCKET_CLOSED);
  }
  const member = bucketDoc.members.find((m) => m.userId.toString() === userId);
  if (member?.invitedBy && member.invitedBy.toString() === userId) {
    throw new AppError(BUCKET_ERRORS.REQUEST_PENDING, 403, ERROR_CODES.REQUEST_PENDING);
  }
  const bucket = await bucketRepository.acceptBucketMember(bucketId, userId, new Date());
  if (!bucket) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  await logAuditEvent({
    actorId: userId,
    bucketId,
    action: AUDIT_ACTIONS.ACCEPT,
    entity: AUDIT_ENTITIES.MEMBER,
    entityId: bucketId,
    note: `Joined bucket "${bucket.name}"`,
  });

  return toDetail(bucket);
}

async function declineInvite(userId: string, bucketId: string): Promise<BucketSummary> {
  const bucket = await requirePendingMember(userId, bucketId);
  await bucketRepository.pullBucketMember(bucketId, userId);

  await logAuditEvent({
    actorId: userId,
    bucketId,
    action: AUDIT_ACTIONS.DECLINE,
    entity: AUDIT_ENTITIES.MEMBER,
    entityId: bucketId,
    note: `Declined invite to "${bucket.name}"`,
  });

  return {
    _id: bucket._id.toString(),
    name: bucket.name,
    icon: bucket.icon,
    ownerId: bucket.ownerId.toString(),
    isPersonal: bucket.isPersonal,
    memberCount: bucket.members.length,
    role: "member",
    status: "pending",
  };
}

async function leaveBucket(userId: string, bucketId: string) {
  const bucket = await bucketRepository.findBucketById(bucketId);
  if (!bucket) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }
  const member = bucket.members.find((m) => m.userId.toString() === userId);
  if (!member || member.status !== "accepted") {
    throw new AppError(BUCKET_ERRORS.NOT_MEMBER, 403, ERROR_CODES.NOT_A_MEMBER);
  }
  if (member.role === "owner") {
    throw new AppError(BUCKET_ERRORS.OWNER_CANNOT_LEAVE, 400, ERROR_CODES.OWNER_CANNOT_LEAVE);
  }

  await bucketRepository.pullBucketMember(bucketId, userId);

  await logAuditEvent({
    actorId: userId,
    bucketId,
    action: AUDIT_ACTIONS.LEAVE,
    entity: AUDIT_ENTITIES.MEMBER,
    entityId: bucketId,
    note: `Left bucket "${bucket.name}"`,
  });

  return { message: "Left the bucket" };
}

async function revokeInvite(
  userId: string,
  bucketId: string,
  targetUserId: string,
): Promise<BucketDetail> {
  const bucket = await requireOwner(userId, bucketId);
  if (!bucket.members.some((m) => m.userId.toString() === targetUserId)) {
    throw new AppError(BUCKET_ERRORS.MEMBER_NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  const updated = await bucketRepository.pullBucketMember(bucketId, targetUserId);
  if (!updated) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  await logAuditEvent({
    actorId: userId,
    bucketId,
    action: AUDIT_ACTIONS.REVOKE,
    entity: AUDIT_ENTITIES.MEMBER,
    entityId: bucketId,
    note: `Revoked invite for member of "${bucket.name}"`,
    metadata: { targetUserId },
  });

  return toDetail(updated);
}

async function getBucketPreview(userId: string, bucketId: string): Promise<BucketPreview> {
  const bucket = await bucketRepository.findBucketById(bucketId);
  if (!bucket) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }
  if (bucket.isPersonal) {
    throw new AppError(BUCKET_ERRORS.IS_PERSONAL, 400, ERROR_CODES.BUCKET_IS_PERSONAL);
  }
  const users = await bucketRepository.findUsersByIds([bucket.ownerId.toString()]);
  const owner = users[0];
  const member = bucket.members.find((m) => m.userId.toString() === userId);
  return {
    _id: bucket._id.toString(),
    name: bucket.name,
    icon: bucket.icon,
    ownerId: bucket.ownerId.toString(),
    ownerName: owner?.name,
    isPersonal: bucket.isPersonal,
    memberCount: bucket.members.length,
    role: member?.role,
    status: member?.status,
  };
}

async function requestToJoin(userId: string, bucketId: string): Promise<BucketPreview> {
  const bucket = await bucketRepository.findBucketById(bucketId);
  if (!bucket) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }
  if (bucket.isPersonal) {
    throw new AppError(BUCKET_ERRORS.IS_PERSONAL, 400, ERROR_CODES.BUCKET_IS_PERSONAL);
  }
  if (bucket.closedAt) {
    throw new AppError(BUCKET_ERRORS.BUCKET_CLOSED, 403, ERROR_CODES.BUCKET_CLOSED);
  }
  const existing = bucket.members.find((m) => m.userId.toString() === userId);
  if (existing) {
    if (existing.status === "accepted") {
      throw new AppError(BUCKET_ERRORS.ALREADY_MEMBER_SELF, 409, ERROR_CODES.ALREADY_MEMBER);
    }
    throw new AppError(BUCKET_ERRORS.ALREADY_PENDING, 409, ERROR_CODES.ALREADY_PENDING);
  }
  await bucketRepository.addBucketMember(bucketId, {
    userId,
    role: "member",
    status: "pending",
    invitedBy: userId,
    invitedAt: new Date(),
  });

  await logAuditEvent({
    actorId: userId,
    bucketId,
    action: AUDIT_ACTIONS.REQUEST,
    entity: AUDIT_ENTITIES.MEMBER,
    entityId: bucketId,
    note: `Requested to join "${bucket.name}"`,
    metadata: { targetUserId: userId },
  });

  return getBucketPreview(userId, bucketId);
}

async function listIncomingRequests(userId: string): Promise<IncomingRequestsGroup[]> {
  const buckets = await bucketRepository.listOwnerPendingRequests(userId);
  if (buckets.length === 0) return [];

  const isJoinRequest = (m: {
    userId: { toString(): string };
    invitedBy?: { toString(): string };
    status: string;
  }) => m.status === "pending" && m.invitedBy?.toString() === m.userId.toString();

  const pendingUserIds = [
    ...new Set(
      buckets.flatMap((b) => b.members.filter(isJoinRequest).map((m) => m.userId.toString())),
    ),
  ];
  if (pendingUserIds.length === 0) return [];
  const users = await bucketRepository.findUsersByIds(pendingUserIds);
  const userById = new Map(users.map((u) => [u._id.toString(), u]));
  return buckets
    .map((bucket) => ({
      bucketId: bucket._id.toString(),
      name: bucket.name,
      icon: bucket.icon,
      requests: bucket.members.filter(isJoinRequest).map((m) => {
        const user = userById.get(m.userId.toString());
        return {
          userId: m.userId.toString(),
          name: user?.name ?? "",
          username: user?.username,
          invitedAt: m.invitedAt?.toISOString(),
        };
      }),
    }))
    .filter((g) => g.requests.length > 0);
}

async function acceptRequest(
  ownerId: string,
  bucketId: string,
  targetUserId: string,
): Promise<BucketDetail> {
  const bucket = await requireOwner(ownerId, bucketId);
  if (bucket.closedAt) {
    throw new AppError(BUCKET_ERRORS.BUCKET_CLOSED, 403, ERROR_CODES.BUCKET_CLOSED);
  }
  const member = bucket.members.find((m) => m.userId.toString() === targetUserId);
  if (!member) {
    throw new AppError(BUCKET_ERRORS.REQUEST_NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }
  if (member.status !== "pending") {
    throw new AppError(BUCKET_ERRORS.ALREADY_MEMBER, 409, ERROR_CODES.ALREADY_MEMBER);
  }
  if (member.invitedBy && member.invitedBy.toString() !== targetUserId) {
    throw new AppError(BUCKET_ERRORS.NOT_JOIN_REQUEST, 400, ERROR_CODES.NOT_JOIN_REQUEST);
  }
  const updated = await bucketRepository.acceptBucketMember(bucketId, targetUserId, new Date());
  if (!updated) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }
  await logAuditEvent({
    actorId: ownerId,
    bucketId,
    action: AUDIT_ACTIONS.ACCEPT,
    entity: AUDIT_ENTITIES.MEMBER,
    entityId: bucketId,
    note: `Approved join request for "${bucket.name}"`,
    metadata: { targetUserId },
  });
  return toDetail(updated);
}

async function searchBuckets(userId: string, searchRequest: unknown) {
  const parsed = bucketSearchSchema.parse(searchRequest ?? {});
  const defaults = defaultBucketSearchRequest();

  const request: BucketSearchRequest = {
    filterCriteria: { ...defaults.filterCriteria, ...parsed.filterCriteria },
    sortCriteria: parsed.sortCriteria ?? defaults.sortCriteria,
    pagination: parsed.pagination ?? defaults.pagination,
  };
  return bucketRepository.searchBuckets(userId, request);
}

async function requireOwner(userId: string, bucketId: string): Promise<BucketDoc> {
  const bucket = await bucketRepository.findBucketById(bucketId);
  if (!bucket) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }
  const member = bucket.members.find((m) => m.userId.toString() === userId);
  if (!member || member.role !== "owner") {
    throw new AppError(BUCKET_ERRORS.OWNER_ONLY, 403, ERROR_CODES.OWNER_ONLY);
  }
  if (bucket.isPersonal) {
    throw new AppError(
      BUCKET_ERRORS.PERSONAL_ACTION_NOT_ALLOWED,
      400,
      ERROR_CODES.BUCKET_IS_PERSONAL,
    );
  }
  return bucket;
}

async function requirePendingMember(userId: string, bucketId: string): Promise<BucketDoc> {
  const bucket = await bucketRepository.findBucketById(bucketId);
  if (!bucket) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }
  const member = bucket.members.find((m) => m.userId.toString() === userId);
  if (!member || member.status !== "pending") {
    throw new AppError(BUCKET_ERRORS.NOT_INVITED, 403, ERROR_CODES.NOT_INVITED);
  }
  return bucket;
}

/** Owner sets each accepted member's % share. Must sum to 100. */
async function setMemberShares(
  userId: string,
  bucketId: string,
  shares: Record<string, number>,
): Promise<BucketDetail> {
  const bucket = await requireOwner(userId, bucketId);
  if (bucket.closedAt) {
    throw new AppError(BUCKET_ERRORS.BUCKET_CLOSED, 403, ERROR_CODES.BUCKET_CLOSED);
  }

  const acceptedIds = new Set(
    bucket.members.filter((m) => m.status === "accepted").map((m) => m.userId.toString()),
  );
  for (const [memberId, pct] of Object.entries(shares)) {
    if (!acceptedIds.has(memberId) || typeof pct !== "number" || pct < 0) {
      throw new AppError(BUCKET_ERRORS.MEMBER_NOT_FOUND, 400, ERROR_CODES.NOT_FOUND);
    }
  }
  for (const memberId of acceptedIds) {
    if (!(memberId in shares)) {
      throw new AppError(BUCKET_ERRORS.MEMBER_NOT_FOUND, 400, ERROR_CODES.NOT_FOUND);
    }
  }

  const totalPercentage = Object.values(shares).reduce((sum, pct) => sum + pct, 0);
  if (totalPercentage !== 100) {
    throw new AppError(
      BUCKET_ERRORS.SHARE_PERCENTAGE_INVALID(100),
      400,
      ERROR_CODES.SHARE_PERCENTAGE_INVALID,
    );
  }

  const updated = await bucketRepository.updateBucketShareConfiguration(bucketId, shares);
  if (!updated) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  await logAuditEvent({
    actorId: userId,
    bucketId,
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.BUCKET,
    entityId: bucketId,
    note: `Set member shares for "${bucket.name}"`,
    metadata: { shareConfiguration: shares },
  });

  return toDetail(updated);
}

/**
 * Balances for every accepted member, computed from real expenses and confirmed
 * peer settlements via `computeSettlement` (join-date proration included).
 */
async function computeBucketBalances(bucket: BucketDoc): Promise<BucketBalances> {
  const accepted = bucket.members.filter((m) => m.status === "accepted");

  const settleMembers = accepted.map((m) => ({
    userId: m.userId.toString(),
    joinedAt: m.joinedAt,
  }));
  const expenses = (await expenseRepository.listExpensesForBucket(bucket._id.toString())).map(
    (e) => ({ userId: e.userId.toString(), amount: e.amount, paidAt: new Date(e.paidAt) }),
  );
  const settlements = (await settlementRepository.listSettlements(bucket._id.toString())).map(
    (s) => ({
      fromUserId: s.fromUserId.toString(),
      toUserId: s.toUserId.toString(),
      amount: s.amount,
    }),
  );

  const shares = toPercentageMap(bucket.shareConfiguration);
  const result = computeSettlement({
    members: settleMembers,
    shares: Object.fromEntries(shares),
    expenses,
    settlements,
    bucketCreatedAt: bucket.createdAt ?? new Date(0),
  });

  const users = await bucketRepository.findUsersByIds(result.members.map((m) => m.memberId));
  const userById = new Map(users.map((u) => [u._id.toString(), u]));
  const defaultPct = accepted.length > 0 ? 100 / accepted.length : 0;
  const memberById = new Map(accepted.map((m) => [m.userId.toString(), m]));

  const members: MemberBalance[] = result.members.map((m) => ({
    memberId: m.memberId,
    memberName: userById.get(m.memberId)?.name ?? "",
    percentage: shares.get(m.memberId) ?? defaultPct,
    owedAmount: m.owedAmount,
    paidAmount: m.paidAmount,
    netBalance: m.netBalance,
    upiId: memberById.get(m.memberId)?.upiId ?? "",
  }));

  const debts: DebtEdge[] = result.debtPlan.map((edge) => ({
    fromUserId: edge.fromUserId,
    fromName: userById.get(edge.fromUserId)?.name ?? "",
    toUserId: edge.toUserId,
    toName: userById.get(edge.toUserId)?.name ?? "",
    amount: edge.amount,
  }));

  return {
    members,
    debts,
    totalExpenses: result.totalExpenses,
    allMembersPaid: result.allSettled,
  };
}

async function getMemberBalances(userId: string, bucketId: string): Promise<BucketBalances> {
  const bucket = await bucketRepository.findBucketById(bucketId);
  if (!bucket) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  const member = bucket.members.find((m) => m.userId.toString() === userId);
  if (!member || member.status !== "accepted") {
    throw new AppError(BUCKET_ERRORS.NOT_MEMBER, 403, ERROR_CODES.NOT_A_MEMBER);
  }

  const balances = await computeBucketBalances(bucket);
  return { ...balances, closedAt: bucket.closedAt?.toISOString() };
}

function toSettlementItem(
  settlement: SettlementDoc,
  userById: Map<string, { name?: string; username?: string }>,
): SettlementItem {
  return {
    _id: settlement._id.toString(),
    bucketId: settlement.bucketId.toString(),
    fromUserId: settlement.fromUserId.toString(),
    toUserId: settlement.toUserId.toString(),
    fromName: userById.get(settlement.fromUserId.toString())?.name,
    toName: userById.get(settlement.toUserId.toString())?.name,
    amount: settlement.amount,
    note: settlement.note,
    confirmedBy: settlement.confirmedBy.toString(),
    confirmedAt: (settlement.confirmedAt ?? settlement.createdAt ?? new Date()).toISOString(),
  };
}

/**
 * The creditor confirms they received the planned settlement from `fromUserId`.
 * The amount is taken from the debt plan, never from the client.
 */
async function confirmSettlement(
  userId: string,
  bucketId: string,
  body: { fromUserId?: string; note?: string },
): Promise<SettlementItem> {
  const bucket = await bucketRepository.findBucketById(bucketId);
  if (!bucket) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }
  if (bucket.closedAt) {
    throw new AppError(BUCKET_ERRORS.BUCKET_CLOSED, 403, ERROR_CODES.BUCKET_CLOSED);
  }

  const fromUserId = body?.fromUserId ?? "";
  const creditor = bucket.members.find((m) => m.userId.toString() === userId);
  if (!creditor || creditor.status !== "accepted") {
    throw new AppError(BUCKET_ERRORS.NOT_MEMBER, 403, ERROR_CODES.NOT_A_MEMBER);
  }
  const debtor = bucket.members.find((m) => m.userId.toString() === fromUserId);
  if (!debtor || debtor.status !== "accepted") {
    throw new AppError(BUCKET_ERRORS.MEMBER_NOT_FOUND, 403, ERROR_CODES.NOT_FOUND);
  }

  const balances = await computeBucketBalances(bucket);
  const outstanding = findOutstandingDebt(balances.debts, fromUserId, userId);
  if (outstanding === null || outstanding <= 0.01) {
    throw new AppError(
      BUCKET_ERRORS.SETTLEMENT_NOTHING_TO_CONFIRM,
      400,
      ERROR_CODES.SETTLEMENT_NOTHING_TO_CONFIRM,
    );
  }

  const created = await settlementRepository.createSettlement({
    bucketId,
    fromUserId,
    toUserId: userId,
    amount: outstanding,
    note: body?.note,
    confirmedBy: userId,
    confirmedAt: new Date(),
  });

  const users = await bucketRepository.findUsersByIds([fromUserId, userId]);
  const userById = new Map(users.map((u) => [u._id.toString(), u]));

  await logAuditEvent({
    actorId: userId,
    bucketId,
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.MEMBER,
    entityId: bucketId,
    note: `Received ${outstanding} from ${userById.get(fromUserId)?.name ?? ""} in "${bucket.name}"`,
    metadata: { amount: outstanding, targetUserId: fromUserId },
  });

  return toSettlementItem(created, userById);
}

async function listSettlements(userId: string, bucketId: string): Promise<SettlementItem[]> {
  const bucket = await bucketRepository.findBucketById(bucketId);
  if (!bucket) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }
  const member = bucket.members.find((m) => m.userId.toString() === userId);
  if (!member || member.status !== "accepted") {
    throw new AppError(BUCKET_ERRORS.NOT_MEMBER, 403, ERROR_CODES.NOT_A_MEMBER);
  }

  const settlements = await settlementRepository.listSettlements(bucketId);
  if (settlements.length === 0) return [];

  const userIds = [
    ...new Set(settlements.flatMap((s) => [s.fromUserId.toString(), s.toUserId.toString()])),
  ];
  const users = await bucketRepository.findUsersByIds(userIds);
  const userById = new Map(users.map((u) => [u._id.toString(), u]));

  return settlements.map((s) => toSettlementItem(s, userById));
}

async function closeBucket(
  userId: string,
  bucketId: string,
): Promise<{ success: boolean; closedAt: Date; message: string }> {
  const bucket = await requireOwner(userId, bucketId);
  if (bucket.closedAt) {
    throw new AppError(BUCKET_ERRORS.BUCKET_ALREADY_CLOSED, 400, ERROR_CODES.BUCKET_ALREADY_CLOSED);
  }

  const balances = await computeBucketBalances(bucket);
  if (!balances.allMembersPaid) {
    const stillOwes = balances.members.filter((m) => m.netBalance > 0).map((m) => m.memberName);
    throw new AppError(
      BUCKET_ERRORS.NOT_ALL_MEMBERS_PAID(stillOwes.join(", ")),
      400,
      ERROR_CODES.NOT_ALL_MEMBERS_PAID,
    );
  }

  const now = new Date();
  await bucketRepository.updateBucketClosedAt(bucketId, now);

  await logAuditEvent({
    actorId: userId,
    bucketId,
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.BUCKET,
    entityId: bucketId,
    note: `Closed bucket "${bucket.name}" - all shares settled`,
  });

  return {
    success: true,
    closedAt: now,
    message: `Bucket "${bucket.name}" closed successfully. All members have paid their shares.`,
  };
}

/** A member updates their own UPI id (used to receive/collect payments). */
async function updateMemberUpiId(
  userId: string,
  bucketId: string,
  upiId: string,
): Promise<BucketDetail> {
  const bucket = await bucketRepository.findBucketById(bucketId);
  if (!bucket) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }
  const member = bucket.members.find((m) => m.userId.toString() === userId);
  if (!member || member.status !== "accepted") {
    throw new AppError(BUCKET_ERRORS.NOT_MEMBER, 403, ERROR_CODES.NOT_A_MEMBER);
  }
  if (bucket.closedAt) {
    throw new AppError(BUCKET_ERRORS.BUCKET_CLOSED, 403, ERROR_CODES.BUCKET_CLOSED);
  }

  const updated = await bucketRepository.updateMemberUpiId(bucketId, userId, upiId);
  if (!updated) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  await logAuditEvent({
    actorId: userId,
    bucketId,
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.MEMBER,
    entityId: bucketId,
    note: `Updated UPI id in "${bucket.name}"`,
    metadata: { targetUserId: userId },
  });

  return toDetail(updated);
}

function toSummary(bucket: BucketDoc, userId: string): BucketSummary {
  const member = bucket.members.find((m) => m.userId.toString() === userId);
  return {
    _id: bucket._id.toString(),
    name: bucket.name,
    icon: bucket.icon,
    ownerId: bucket.ownerId.toString(),
    isPersonal: bucket.isPersonal,
    memberCount: bucket.members.length,
    role: member?.role ?? "member",
    status: member?.status ?? "pending",
    closedAt: bucket.closedAt?.toISOString(),
  };
}

async function toDetail(bucket: BucketDoc): Promise<BucketDetail> {
  const users = await bucketRepository.findUsersByIds(
    bucket.members.map((m) => m.userId.toString()),
  );
  const userById = new Map(users.map((u) => [u._id.toString(), u]));

  const owner = bucket.members.find((m) => m.role === "owner");

  return {
    _id: bucket._id.toString(),
    name: bucket.name,
    icon: bucket.icon,
    ownerId: bucket.ownerId.toString(),
    ownerName: owner ? userById.get(owner.userId.toString())?.name : undefined,
    isPersonal: bucket.isPersonal,
    memberCount: bucket.members.length,
    members: bucket.members.map((m: BucketMemberDoc) => {
      const user = userById.get(m.userId.toString());
      return {
        userId: m.userId.toString(),
        name: user?.name ?? "",
        username: user?.username,
        role: m.role,
        status: m.status,
        upiId: m.upiId,
        invitedBy: m.invitedBy?.toString(),
        invitedAt: m.invitedAt?.toISOString(),
        joinedAt: m.joinedAt?.toISOString(),
      };
    }),
    createdAt: bucket.createdAt?.toISOString(),
    updatedAt: bucket.updatedAt?.toISOString(),
    closedAt: bucket.closedAt?.toISOString(),
  };
}

function defaultBucketSearchRequest(): BucketSearchRequest {
  return {
    filterCriteria: {
      date: { preset: "THIS_MONTH" },
    },
    sortCriteria: { field: "createdAt", direction: "DESC" },
    pagination: { page: 1, pageSize: 20 },
  };
}

const bucketService = {
  listBuckets,
  createBucket,
  getBucketStats,
  updateBucket,
  deleteBucket,
  inviteUser,
  acceptInvite,
  declineInvite,
  leaveBucket,
  revokeInvite,
  getBucketPreview,
  requestToJoin,
  listIncomingRequests,
  acceptRequest,
  searchBuckets,
  setMemberShares,
  getMemberBalances,
  closeBucket,
  updateMemberUpiId,
  confirmSettlement,
  listSettlements,
};

export default bucketService;
export {
  setMemberShares,
  getMemberBalances,
  closeBucket,
  updateMemberUpiId,
  confirmSettlement,
  listSettlements,
};
