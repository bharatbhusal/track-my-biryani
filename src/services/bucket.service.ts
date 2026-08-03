import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { bucketSchema, inviteSchema } from "@/lib/validators";
import {
	addBucketMember,
	acceptBucketMember,
	createBucket,
	deleteBucket,
	expenseExistsInBucket,
	findBucketById,
	findUsersByIds,
	listBucketsForMember,
	listBucketsForPendingMember,
	pullBucketMember,
	updateBucketName,
	type BucketDoc,
} from "@/repositories/bucket.repository";
import { ensureCategoryInBucket } from "@/repositories/category.repository";
import { findUserByUsername } from "@/repositories/user.repository";
import { logAuditEvent } from "@/services/audit.service";
import type {
	BucketDetail,
	BucketsListPayload,
	BucketSummary,
} from "@/types/bucket.types";

export async function listBucketsService(
	userId: string,
): Promise<BucketsListPayload> {
	const [accepted, invitations] = await Promise.all([
		listBucketsForMember(userId),
		listBucketsForPendingMember(userId),
	]);

	const items: BucketSummary[] = [
		{
			_id: null,
			name: "Personal",
			icon: "📁",
			ownerId: userId,
			memberCount: 1,
			role: "owner",
			status: "accepted",
		},
		...accepted.map((bucket) => toSummary(bucket, userId)),
	];

	return {
		items,
		invitations: invitations.map((bucket) =>
			toSummary(bucket, userId),
		),
	};
}

export async function createBucketService(
	userId: string,
	body: unknown,
): Promise<BucketDetail> {
	const payload = bucketSchema.parse(body);

	const bucket = await createBucket({
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
		await ensureCategoryInBucket(
			userId,
			bucket._id.toString(),
			category,
		);
	}

	await logAuditEvent({
		userId,
		action: "create",
		entityType: "bucket",
		entityId: bucket._id.toString(),
		metadata: { name: bucket.name },
	});

	return toDetail(bucket);
}

export async function getBucketService(
	userId: string,
	bucketId: string,
): Promise<BucketDetail> {
	const bucket = await findBucketById(bucketId);
	if (!bucket) {
		throw new AppError("Bucket not found", 404, "NOT_FOUND");
	}
	const member = bucket.members.find(
		(m) => m.userId.toString() === userId,
	);
	if (!member || member.status !== "accepted") {
		throw new AppError(
			"Not a member of this bucket",
			403,
			"NOT_A_MEMBER",
		);
	}
	return toDetail(bucket);
}

export async function updateBucketService(
	userId: string,
	bucketId: string,
	body: unknown,
): Promise<BucketDetail> {
	const payload = bucketSchema.parse(body);
	await requireOwner(userId, bucketId);
	const bucket = await updateBucketName(bucketId, {
		name: payload.name,
		icon: payload.icon,
	});

	await logAuditEvent({
		userId,
		action: "update",
		entityType: "bucket",
		entityId: bucketId,
		metadata: { name: payload.name },
	});

	return toDetail(bucket!);
}

export async function deleteBucketService(
	userId: string,
	bucketId: string,
) {
	await requireOwner(userId, bucketId);
	const hasExpenses = await expenseExistsInBucket(bucketId);
	if (hasExpenses) {
		throw new AppError(
			"Cannot delete bucket with expenses",
			400,
			"HAS_EXPENSES",
		);
	}

	await deleteBucket(bucketId);

	await logAuditEvent({
		userId,
		action: "delete",
		entityType: "bucket",
		entityId: bucketId,
	});

	return { message: "Bucket deleted" };
}

export async function inviteUserService(
	userId: string,
	bucketId: string,
	body: unknown,
): Promise<BucketDetail> {
	const payload = inviteSchema.parse(body);
	const bucket = await requireOwner(userId, bucketId);

	const user = await findUserByUsername(payload.username);
	if (!user) {
		throw new AppError("User not found", 404, "USER_NOT_FOUND");
	}
	const targetId = user._id.toString();
	if (
		bucket.members.some(
			(m) => m.userId.toString() === targetId,
		)
	) {
		throw new AppError(
			"User is already a member of this bucket",
			409,
			"ALREADY_MEMBER",
		);
	}

	const updated = await addBucketMember(bucketId, {
		userId: targetId,
		role: "member",
		status: "pending",
		invitedBy: userId,
		invitedAt: new Date(),
	});

	await logAuditEvent({
		userId,
		action: "invite",
		entityType: "bucket-member",
		entityId: bucketId,
		metadata: { targetUserId: targetId },
	});

	return toDetail(updated!);
}

export async function acceptInviteService(
	userId: string,
	bucketId: string,
): Promise<BucketDetail> {
	await requirePendingMember(userId, bucketId);
	const bucket = await acceptBucketMember(bucketId, userId, new Date());

	await logAuditEvent({
		userId,
		action: "accept",
		entityType: "bucket-member",
		entityId: bucketId,
	});

	return toDetail(bucket!);
}

export async function declineInviteService(
	userId: string,
	bucketId: string,
): Promise<BucketSummary> {
	const bucket = await requirePendingMember(userId, bucketId);
	await pullBucketMember(bucketId, userId);

	await logAuditEvent({
		userId,
		action: "decline",
		entityType: "bucket-member",
		entityId: bucketId,
	});

	return {
		_id: bucket._id.toString(),
		name: bucket.name,
		icon: bucket.icon,
		ownerId: bucket.ownerId.toString(),
		memberCount: bucket.members.length,
		role: "member",
		status: "pending",
	};
}

export async function leaveBucketService(
	userId: string,
	bucketId: string,
) {
	const bucket = await findBucketById(bucketId);
	if (!bucket) {
		throw new AppError("Bucket not found", 404, "NOT_FOUND");
	}
	const member = bucket.members.find(
		(m) => m.userId.toString() === userId,
	);
	if (!member || member.status !== "accepted") {
		throw new AppError(
			"Not a member of this bucket",
			403,
			"NOT_A_MEMBER",
		);
	}
	if (member.role === "owner") {
		throw new AppError(
			"Owner cannot leave the bucket. Delete the bucket instead.",
			400,
			"OWNER_CANNOT_LEAVE",
		);
	}

	await pullBucketMember(bucketId, userId);

	await logAuditEvent({
		userId,
		action: "leave",
		entityType: "bucket-member",
		entityId: bucketId,
	});

	return { message: "Left the bucket" };
}

export async function revokeInviteService(
	userId: string,
	bucketId: string,
	targetUserId: string,
): Promise<BucketDetail> {
	const bucket = await requireOwner(userId, bucketId);
	if (
		!bucket.members.some(
			(m) => m.userId.toString() === targetUserId,
		)
	) {
		throw new AppError("Member not found", 404, "NOT_FOUND");
	}

	const updated = await pullBucketMember(bucketId, targetUserId);

	await logAuditEvent({
		userId,
		action: "revoke",
		entityType: "bucket-member",
		entityId: bucketId,
		metadata: { targetUserId },
	});

	return toDetail(updated!);
}

async function requireOwner(
	userId: string,
	bucketId: string,
): Promise<BucketDoc> {
	const bucket = await findBucketById(bucketId);
	if (!bucket) {
		throw new AppError("Bucket not found", 404, "NOT_FOUND");
	}
	const member = bucket.members.find(
		(m) => m.userId.toString() === userId,
	);
	if (!member || member.role !== "owner") {
		throw new AppError(
			"Only the bucket owner can perform this action",
			403,
			"OWNER_ONLY",
		);
	}
	return bucket;
}

async function requirePendingMember(
	userId: string,
	bucketId: string,
): Promise<BucketDoc> {
	const bucket = await findBucketById(bucketId);
	if (!bucket) {
		throw new AppError("Bucket not found", 404, "NOT_FOUND");
	}
	const member = bucket.members.find(
		(m) => m.userId.toString() === userId,
	);
	if (!member || member.status !== "pending") {
		throw new AppError(
			"You were not invited to this bucket",
			403,
			"NOT_INVITED",
		);
	}
	return bucket;
}

function toSummary(bucket: BucketDoc, userId: string): BucketSummary {
	const member = bucket.members.find(
		(m) => m.userId.toString() === userId,
	);
	return {
		_id: bucket._id.toString(),
		name: bucket.name,
		icon: bucket.icon,
		ownerId: bucket.ownerId.toString(),
		memberCount: bucket.members.length,
		role: member?.role ?? "member",
		status: member?.status ?? "pending",
	};
}

async function toDetail(bucket: BucketDoc): Promise<BucketDetail> {
	const users = await findUsersByIds(
		bucket.members.map((m) => m.userId.toString()),
	);
	const userById = new Map(
		users.map((u) => [u._id.toString(), u]),
	);

	return {
		_id: bucket._id.toString(),
		name: bucket.name,
		icon: bucket.icon,
		ownerId: bucket.ownerId.toString(),
		memberCount: bucket.members.length,
		members: bucket.members.map((m) => {
			const user = userById.get(m.userId.toString());
			return {
				userId: m.userId.toString(),
				name: user?.name ?? "",
				username: user?.username,
				role: m.role,
				status: m.status,
				invitedBy: m.invitedBy?.toString(),
				invitedAt: m.invitedAt?.toISOString(),
				joinedAt: m.joinedAt?.toISOString(),
			};
		}),
		createdAt: bucket.createdAt?.toISOString(),
		updatedAt: bucket.updatedAt?.toISOString(),
	};
}
