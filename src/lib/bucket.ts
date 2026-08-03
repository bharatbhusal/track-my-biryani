import { Types } from "mongoose";

import { AppError } from "@/lib/errors";
import { BucketModel } from "@/models/Bucket";

const PERSONAL_BUCKET = "personal";

type BucketMemberDoc = {
	userId: Types.ObjectId;
	role: "owner" | "member";
	status: "pending" | "accepted";
	invitedBy?: Types.ObjectId;
	invitedAt?: Date;
	joinedAt?: Date;
};

export async function resolveBucketContext(
	userId: string,
	bucketId?: string | null,
): Promise<{ bucketId: string | null }> {
	if (!bucketId || bucketId === PERSONAL_BUCKET) {
		return { bucketId: null };
	}

	if (!Types.ObjectId.isValid(bucketId)) {
		throw new AppError(
			"Not a member of this bucket",
			403,
			"NOT_A_MEMBER",
		);
	}

	const bucket = await BucketModel.findById(bucketId).lean();
	const member = (bucket?.members ?? []).find(
		(m: BucketMemberDoc) =>
			m.userId.toString() === userId &&
			m.status === "accepted",
	);
	if (!bucket || !member) {
		throw new AppError(
			"Not a member of this bucket",
			403,
			"NOT_A_MEMBER",
		);
	}

	return { bucketId };
}
