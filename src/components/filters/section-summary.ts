import { presetLabel } from "@/lib/date-range";
import { formatShortDateTime } from "@/lib/datetime";
import type { BucketSummary } from "@/constants/types/bucket.types";
import type { CategoryItem } from "@/constants/types/expense.types";
import type { FilterDatePreset } from "@/constants/types/search.types";
import type { FilterOwner } from "./owner-filter-section";
import type { FilterVariant } from "./variants";
import { sortFieldLabel } from "./variants";

export function customRangeLabel(from?: string, to?: string): string {
  const fmt = formatShortDateTime;
  if (from && to) return `${fmt(from)} – ${fmt(to)}`;
  if (from) return `From ${fmt(from)}`;
  if (to) return `Until ${fmt(to)}`;
  return "Custom Date & Time Range";
}

export function dateSummary(
  preset: FilterDatePreset,
  customFrom?: string,
  customTo?: string,
): string {
  if (preset === "CUSTOM") return customRangeLabel(customFrom, customTo);
  return presetLabel(preset);
}

export function bucketSummary(preset: string, ids: string[], buckets: BucketSummary[]): string {
  if (preset === "PERSONAL") return "Personal";
  if (preset === "ALL") return "All buckets";
  return ids.map((id) => buckets.find((b) => b._id === id)?.name ?? "Bucket").join(", ");
}

export function categorySummary(preset: string, ids: string[], categories: CategoryItem[]): string {
  if (preset === "ALL") return "All categories";
  return ids.map((id) => categories.find((c) => c._id === id)?.name ?? "Category").join(", ");
}

export function ownerSummary(preset: string, ids: string[], owners: FilterOwner[]): string {
  if (preset === "ME") return "Me";
  if (preset === "ALL") return "All users";
  return ids
    .map(
      (id) =>
        owners.find((o) => o.id === id)?.name ??
        owners.find((o) => o.id === id)?.username ??
        "User",
    )
    .join(", ");
}

export function sortSummary(variant: FilterVariant, field: string, direction: string): string {
  return `${sortFieldLabel(variant, field)} ${direction === "ASC" ? "↑" : "↓"}`;
}

export function additionalSummary(hasNotes?: boolean, hasLocation?: boolean): string {
  const parts: string[] = [];
  if (hasNotes !== undefined) parts.push(hasNotes ? "Has notes" : "No notes");
  if (hasLocation !== undefined) parts.push(hasLocation ? "Has location" : "No location");
  return parts.join(", ") || "Any";
}
