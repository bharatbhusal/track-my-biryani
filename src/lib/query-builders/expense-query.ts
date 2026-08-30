import { Types } from "mongoose";

import { toIsoBoundsForPreset } from "@/lib/date-range";
import { resolveBucketScope } from "@/lib/query-builders/membership";
import { escapeRegex } from "@/lib/utils";
import type { ExpenseSearchRequest } from "@/types/search.types";

type MongoFilter = Record<string, unknown>;
type MongoSort = Record<string, 1 | -1>;

export async function buildExpenseQuery(
  userId: string,
  request: ExpenseSearchRequest,
): Promise<{
  query: MongoFilter;
  sort: MongoSort;
  skip: number;
  limit: number;
}> {
  const filters = request.filterCriteria;
  const query: MongoFilter = {};

  query.bucketId = await resolveBucketScope(userId, filters.bucketPreset, filters.bucketIds);

  if (filters.categoryPreset === "MULTIPLE") {
    const ids = filters.categoryIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (ids.length > 0) {
      query.categoryId = { $in: ids };
    }
  }

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
    query.paidAt = {
      ...(bounds.from ? { $gte: new Date(bounds.from) } : {}),
      ...(bounds.to ? { $lte: new Date(bounds.to) } : {}),
    };
  }

  const and: MongoFilter[] = [];

  const q = filters.q?.trim();
  if (q) {
    const regex = new RegExp(escapeRegex(q), "i");
    and.push({ $or: [{ title: regex }, { notes: regex }] });
  }

  if (filters.hasNotes !== undefined) {
    and.push(
      filters.hasNotes
        ? { notes: { $exists: true, $nin: ["", null] } }
        : { $or: [{ notes: { $exists: false } }, { notes: { $in: ["", null] } }] },
    );
  }

  // location is required in the schema, so "no location" is the sentinel 0/0.
  // ponytail: $ne also matches missing fields, so pair it with $exists for
  // legacy documents written before location was required.
  if (filters.hasLocation !== undefined) {
    and.push(
      filters.hasLocation
        ? {
            $or: [
              { "location.latitude": { $exists: true, $ne: 0 } },
              { "location.longitude": { $exists: true, $ne: 0 } },
            ],
          }
        : {
            $or: [
              { "location.latitude": { $exists: false } },
              { "location.latitude": 0, "location.longitude": 0 },
            ],
          },
    );
  }

  if (and.length > 0) {
    query.$and = and;
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
