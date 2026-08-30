import { Types } from "mongoose";

import { toIsoBoundsForPreset } from "@/lib/date-range";
import { resolveBucketScope } from "@/lib/query-builders/membership";
import { escapeRegex } from "@/lib/utils";
import type { CategorySearchRequest } from "@/types/search.types";

type MongoFilter = Record<string, unknown>;
type MongoSort = Record<string, 1 | -1>;

export async function buildCategoryQuery(
  userId: string,
  request: CategorySearchRequest,
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
    query.userId = new Types.ObjectId(userId);
  } else if (filters.ownerPreset === "MULTIPLE") {
    query.userId = {
      $in: filters.ownerIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id)),
    };
  }

  const bounds = toIsoBoundsForPreset(filters.datePreset, filters.customFrom, filters.customTo);
  if (bounds) {
    query.createdAt = {
      ...(bounds.from ? { $gte: new Date(bounds.from) } : {}),
      ...(bounds.to ? { $lte: new Date(bounds.to) } : {}),
    };
  }

  const q = filters.q?.trim();
  if (q) {
    query.name = new RegExp(escapeRegex(q), "i");
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
