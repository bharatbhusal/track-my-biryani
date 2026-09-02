import { Types } from "mongoose";

import type { BucketSearchRequest } from "@/constants/types/search.types";

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

  const sort: MongoSort = {
    [request.sortCriteria.field]: request.sortCriteria.direction === "ASC" ? 1 : -1,
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
