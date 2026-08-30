import { Types } from "mongoose";

import { toIsoBoundsForPreset } from "@/lib/date-range";
import { resolveBucketScope } from "@/lib/query-builders/membership";
import type { AuditSearchRequest } from "@/types/search.types";

type MongoFilter = Record<string, unknown>;
type MongoSort = Record<string, 1 | -1>;

export async function buildAuditQuery(
  userId: string,
  request: AuditSearchRequest,
): Promise<{
  query: MongoFilter;
  sort: MongoSort;
  skip: number;
  limit: number;
}> {
  const filters = request.filterCriteria;
  const query: MongoFilter = {};

  query.bucketId = await resolveBucketScope(userId, filters.bucketPreset, filters.bucketIds);

  if (filters.ownerPreset === "ME") {
    query.actorId = new Types.ObjectId(userId);
  } else if (filters.ownerPreset === "MULTIPLE") {
    query.actorId = {
      $in: filters.ownerIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id)),
    };
  }

  const bounds = toIsoBoundsForPreset(filters.datePreset, filters.customFrom, filters.customTo);
  if (bounds) {
    query.timestamp = {
      ...(bounds.from ? { $gte: new Date(bounds.from) } : {}),
      ...(bounds.to ? { $lte: new Date(bounds.to) } : {}),
    };
  }

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
