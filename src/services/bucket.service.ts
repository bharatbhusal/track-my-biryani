import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import {
	bucketSchema,
	inviteSchema,
} from "@/lib/validators";
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
import {
	ensureCategoryInBucket,
	deleteCategoriesByBucket,
} from "@/repositories/category.repository";
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

	const items: BucketSummary[] = accepted.map((bucket) =>
		toSummary(bucket, userId),
	);

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
		actorId: userId,
		bucketId: bucket._id.toString(),
		action: "create",
		entity: "bucket",
		entityId: bucket._id.toString(),
		note: `Created bucket "${bucket.name}"`,
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
		actorId: userId,
		bucketId,
		action: "update",
		entity: "bucket",
		entityId: bucketId,
		note: `Updated bucket "${payload.name}"`,
	});

	return toDetail(bucket!);
}

export async function deleteBucketService(
	userId: string,
	bucketId: string,
) {
	const bucket = await requireOwner(userId, bucketId);
	const hasExpenses = await expenseExistsInBucket(bucketId);
	if (hasExpenses) {
		throw new AppError(
			"Cannot delete bucket with expenses",
			400,
			"HAS_EXPENSES",
		);
	}

	await deleteCategoriesByBucket(bucketId);
	await deleteBucket(bucketId);

	await logAuditEvent({
		actorId: userId,
		bucketId,
		action: "delete",
		entity: "bucket",
		entityId: bucketId,
		note: `Deleted bucket "${bucket.name}"`,
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
		throw new AppError(
			"User not found",
			404,
			"USER_NOT_FOUND",
		);
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
		actorId: userId,
		bucketId,
		action: "invite",
		entity: "bucket-member",
		entityId: bucketId,
		note: `Invited @${user.username} to ${bucket.name}`,
		metadata: { targetUserId: targetId },
	});

	return toDetail(updated!);
}

export async function acceptInviteService(
	userId: string,
	bucketId: string,
): Promise<BucketDetail> {
	await requirePendingMember(userId, bucketId);
	const bucket = await acceptBucketMember(
		bucketId,
		userId,
		new Date(),
	);

	await logAuditEvent({
		actorId: userId,
		bucketId,
		action: "accept",
		entity: "bucket-member",
		entityId: bucketId,
		note: `Joined bucket "${bucket!.name}"`,
	});

	return toDetail(bucket!);
}

export async function declineInviteService(
	userId: string,
	bucketId: string,
): Promise<BucketSummary> {
	const bucket = await requirePendingMember(
		userId,
		bucketId,
	);
	await pullBucketMember(bucketId, userId);

	await logAuditEvent({
		actorId: userId,
		bucketId,
		action: "decline",
		entity: "bucket-member",
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
		actorId: userId,
		bucketId,
		action: "leave",
		entity: "bucket-member",
		entityId: bucketId,
		note: `Left bucket "${bucket.name}"`,
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

	const updated = await pullBucketMember(
		bucketId,
		targetUserId,
	);

	await logAuditEvent({
		actorId: userId,
		bucketId,
		action: "revoke",
		entity: "bucket-member",
		entityId: bucketId,
		note: `Revoked invite for member of "${bucket.name}"`,
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
	if (bucket.isPersonal) {
		throw new AppError(
			"This action is not allowed on the personal bucket",
			400,
			"BUCKET_IS_PERSONAL",
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

function toSummary(
	bucket: BucketDoc,
	userId: string,
): BucketSummary {
	const member = bucket.members.find(
		(m) => m.userId.toString() === userId,
	);
	return {
		_id: bucket._id.toString(),
		name: bucket.name,
		icon: bucket.icon,
		ownerId: bucket.ownerId.toString(),
		isPersonal: bucket.isPersonal,
		memberCount: bucket.members.length,
		role: member?.role ?? "member",
		status: member?.status ?? "pending",
	};
}

async function toDetail(
	bucket: BucketDoc,
): Promise<BucketDetail> {
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
		isPersonal: bucket.isPersonal,
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
