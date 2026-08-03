import { Types } from "mongoose";

import { BucketModel } from "@/models/Bucket";
import { ExpenseModel } from "@/models/Expense";
import { UserModel } from "@/models/User";

export type BucketMemberDoc = {
	userId: Types.ObjectId;
	role: "owner" | "member";
	status: "pending" | "accepted";
	invitedBy?: Types.ObjectId;
	invitedAt?: Date;
	joinedAt?: Date;
};

export type BucketDoc = {
	_id: Types.ObjectId;
	name: string;
	icon?: string;
	ownerId: Types.ObjectId;
	members: BucketMemberDoc[];
	createdAt?: Date;
	updatedAt?: Date;
};

export type BucketMemberInput = {
	userId: string;
	role: "owner" | "member";
	status: "pending" | "accepted";
	invitedBy?: string;
	invitedAt?: Date;
	joinedAt?: Date;
};

export async function listBucketsForMember(userId: string) {
	const buckets = await BucketModel.find({
		members: {
			$elemMatch: {
				userId: new Types.ObjectId(userId),
				status: "accepted",
			},
		},
	}).lean();
	return buckets as unknown as BucketDoc[];
}

export async function listBucketsForPendingMember(userId: string) {
	const buckets = await BucketModel.find({
		members: {
			$elemMatch: {
				userId: new Types.ObjectId(userId),
				status: "pending",
			},
		},
	}).lean();
	return buckets as unknown as BucketDoc[];
}

export async function findBucketById(id: string) {
	if (!Types.ObjectId.isValid(id)) {
		return null;
	}
	const bucket = await BucketModel.findById(id).lean();
	return (bucket as unknown as BucketDoc | null) ?? null;
}

export async function createBucket(data: {
	name: string;
	icon?: string;
	ownerId: string;
	members: BucketMemberInput[];
}) {
	const bucket = await BucketModel.create(data);
	return bucket.toObject() as unknown as BucketDoc;
}

export async function updateBucketName(
	id: string,
	data: { name: string; icon?: string },
) {
	if (!Types.ObjectId.isValid(id)) {
		return null;
	}
	const bucket = await BucketModel.findByIdAndUpdate(
		id,
		{
			$set: {
				name: data.name,
				...(data.icon !== undefined ? { icon: data.icon } : {}),
			},
		},
		{ new: true, lean: true },
	);
	return (bucket as unknown as BucketDoc | null) ?? null;
}

export async function deleteBucket(id: string) {
	if (!Types.ObjectId.isValid(id)) {
		return null;
	}
	return BucketModel.findByIdAndDelete(id).lean();
}

export async function addBucketMember(
	id: string,
	member: BucketMemberInput,
) {
	if (!Types.ObjectId.isValid(id)) {
		return null;
	}
	const bucket = await BucketModel.findByIdAndUpdate(
		id,
		{ $push: { members: member } },
		{ new: true, lean: true },
	);
	return (bucket as unknown as BucketDoc | null) ?? null;
}

export async function acceptBucketMember(
	id: string,
	userId: string,
	joinedAt: Date,
) {
	if (!Types.ObjectId.isValid(id)) {
		return null;
	}
	const bucket = await BucketModel.findOneAndUpdate(
		{ _id: id, "members.userId": new Types.ObjectId(userId) },
		{
			$set: {
				"members.$.status": "accepted",
				"members.$.joinedAt": joinedAt,
			},
		},
		{ new: true, lean: true },
	);
	return (bucket as unknown as BucketDoc | null) ?? null;
}

export async function pullBucketMember(id: string, userId: string) {
	if (!Types.ObjectId.isValid(id)) {
		return null;
	}
	const bucket = await BucketModel.findByIdAndUpdate(
		id,
		{ $pull: { members: { userId: new Types.ObjectId(userId) } } },
		{ new: true, lean: true },
	);
	return (bucket as unknown as BucketDoc | null) ?? null;
}

export async function expenseExistsInBucket(bucketId: string) {
	if (!Types.ObjectId.isValid(bucketId)) {
		return false;
	}
	return Boolean(
		await ExpenseModel.exists({
			bucketId: new Types.ObjectId(bucketId),
		}),
	);
}

export async function findUsersByIds(ids: string[]) {
	return UserModel.find({ _id: { $in: ids } })
		.select("name username")
		.lean();
}
