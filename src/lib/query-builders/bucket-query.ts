import { Types } from "mongoose";

import { BUCKET_SORTABLE_FIELDS } from "@/constants/types/search.types";
import type { BucketSearchRequest } from "@/constants/types/search.types";
import {
  buildPaging,
  buildSort,
  type MongoFilter,
  type MongoSort,
} from "@/lib/query-builders/shared";

export async function buildBucketQuery(
  userId: string,
  request: BucketSearchRequest,
): Promise<{
  query: MongoFilter;
  sort: MongoSort;
  skip: number;
  limit: number;
}> {
  // ponytail: membership list ignores filter.date/filter.owner — those only
  // scope the per-bucket expense totals in the repository layer.
  // pending self-requests (invitedBy === userId) are not "invitations" — they must be
  // approved by owner, not self-accepted. Exclude them from the regular bucket list.
  const uid = new Types.ObjectId(userId);
  const query: MongoFilter = {
    $or: [
      { members: { $elemMatch: { userId: uid, status: "accepted" } } },
      {
        members: {
          $elemMatch: {
            userId: uid,
            status: "pending",
            invitedBy: { $ne: uid },
          },
        },
      },
    ],
  };

  return {
    query,
    sort: buildSort(BUCKET_SORTABLE_FIELDS, request.sortCriteria),
    ...buildPaging(request.pagination),
  };
}
