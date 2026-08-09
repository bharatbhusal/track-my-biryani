import { Types } from "mongoose";

import { toIsoBoundsForPreset } from "@/lib/date-range";
import type { BucketSearchRequest } from "@/types/search.types";

type MongoFilter = Record<string, unknown>;
type MongoSort = Record<string, 1 | -1>;

export async function buildBucketQuery(
	userId: string,
	request: BucketSearchRequest,
): Promise<{
	query: MongoFilter;
	sort: MongoSort;
	skip: number;
	limit: number;
}> {
	const filters = request.filterCriteria;
	const query: MongoFilter = {
		members: {
			$elemMatch: {
				userId: new Types.ObjectId(userId),
				status: "accepted",
			},
		},
	};

	const bounds = toIsoBoundsForPreset(
		filters.datePreset,
		filters.customFrom,
		filters.customTo,
	);
	if (bounds) {
		query.createdAt = {
			...(bounds.from ? { $gte: new Date(bounds.from) } : {}),
			...(bounds.to ? { $lte: new Date(bounds.to) } : {}),
		};
	}

	const sort: MongoSort = {
		[request.sortCriteria.field]:
			request.sortCriteria.direction === "ASC" ? 1 : -1,
	};
	const page = request.pagination.page;
	const pageSize = request.pagination.pageSize;

	return {
		query,
		sort,
		skip: (page - 1) * pageSize,
		limit: pageSize,
	};
}
