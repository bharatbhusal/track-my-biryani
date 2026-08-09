import { Types } from "mongoose";

import { BucketModel } from "@/models/Bucket";

export async function accessibleBucketIds(
	userId: string,
): Promise<Types.ObjectId[]> {
	const buckets = await BucketModel.find({
		members: {
			$elemMatch: {
				userId: new Types.ObjectId(userId),
				status: "accepted",
			},
		},
	})
		.select("_id")
		.lean();

	return buckets.map((b) => b._id as Types.ObjectId);
}

export async function resolveBucketScope(
	userId: string,
	preset: "PERSONAL" | "ALL" | "MULTIPLE",
	requestedIds: string[],
): Promise<{ $in: Types.ObjectId[] }> {
	if (preset === "PERSONAL") {
		const personal = await BucketModel.findOne({
			ownerId: new Types.ObjectId(userId),
			isPersonal: true,
		})
			.select("_id")
			.lean();
		return { $in: personal ? [personal._id as Types.ObjectId] : [] };
	}

	const allowed = await accessibleBucketIds(userId);

	if (preset === "ALL") {
		return { $in: allowed };
	}

	const allowedSet = new Set(allowed.map((id) => id.toString()));
	return {
		$in: requestedIds
			.filter((id) => Types.ObjectId.isValid(id) && allowedSet.has(id))
			.map((id) => new Types.ObjectId(id)),
	};
}
