import { Types } from "mongoose";
import type { NextRequest } from "next/server";

import { BUCKET_ID_HEADER } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { BucketModel } from "@/models/Bucket";

export function getBucketId(
	request: NextRequest,
): string | undefined {
	const bucketId = request.headers.get(BUCKET_ID_HEADER);
	if (!bucketId) {
		return undefined;
	}

	if (!Types.ObjectId.isValid(bucketId)) {
		throw new AppError(
			"Invalid bucket id",
			400,
			"INVALID_BUCKET_ID",
		);
	}

	return bucketId;
}

export async function resolveBucketContext(
	userId: string,
	bucketId?: string | null,
): Promise<{ bucketId: string }> {
	if (!bucketId) {
		const personal = await BucketModel.findOne({
			ownerId: new Types.ObjectId(userId),
			isPersonal: true,
		}).lean();
		if (!personal) {
			throw new AppError(
				"Personal bucket not found",
				404,
				"NOT_FOUND",
			);
		}
		return { bucketId: personal._id.toString() };
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
		(m: { userId: Types.ObjectId; status: string }) =>
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
