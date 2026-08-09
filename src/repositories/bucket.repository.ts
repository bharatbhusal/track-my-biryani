import { Types } from "mongoose";

import { buildBucketQuery } from "@/lib/query-builders";
import { BucketModel } from "@/models/Bucket";
import { ExpenseModel } from "@/models/Expense";
import { UserModel } from "@/models/User";
import type { BucketSearchRequest, SearchResult } from "@/types/search.types";
import type { BucketSummary } from "@/types/bucket.types";

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
	isPersonal?: boolean;
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
	isPersonal?: boolean;
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

export async function searchBuckets(
	userId: string,
	request: BucketSearchRequest,
): Promise<SearchResult<BucketSummary>> {
	const { query, sort, skip, limit } = await buildBucketQuery(
		userId,
		request,
	);

	const [items, total] = await Promise.all([
		BucketModel.aggregate([
			{ $match: query },
			{ $addFields: { memberCount: { $size: "$members" } } },
			{
				$lookup: {
					from: "expenses",
					localField: "_id",
					foreignField: "bucketId",
					as: "bucketExpenses",
				},
			},
			{
				$addFields: {
					totalAmount: { $sum: "$bucketExpenses.amount" },
				},
			},
			{ $project: { bucketExpenses: 0 } },
			{ $sort: sort },
			{ $skip: skip },
			{ $limit: limit },
		]),
		BucketModel.countDocuments(query),
	]);

	return {
		items: items.map((bucket) => {
			const member = bucket.members.find(
				(m: BucketMemberDoc) => m.userId.toString() === userId,
			);
			return {
				_id: bucket._id.toString(),
				name: bucket.name,
				icon: bucket.icon,
				ownerId: bucket.ownerId.toString(),
				isPersonal: bucket.isPersonal,
				memberCount: bucket.memberCount,
				totalAmount: bucket.totalAmount,
				createdAt: bucket.createdAt?.toISOString(),
				role: (member?.role ?? "member") as "owner" | "member",
				status: (member?.status ?? "pending") as "pending" | "accepted",
			} satisfies BucketSummary;
		}),
		total,
		page: request.pagination.page,
		totalPages: Math.ceil(total / request.pagination.pageSize) || 1,
	};
}
