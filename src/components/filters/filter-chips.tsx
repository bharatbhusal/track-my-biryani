"use client";

import { Chip } from "@/components/ui/chip";
import { presetLabel } from "@/lib/date-range";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { BucketSummary } from "@/constants/types/bucket.types";
import type { CategoryItem } from "@/constants/types/expense.types";
import type { FilterOwner } from "./owner-filter-section";
import { customRangeLabel } from "./section-summary";
import {
  ACTIONS,
  resolveSections,
  sortFieldLabel,
  sortForVariant,
  type FilterVariant,
  type SectionFlags,
} from "./variants";

type FilterChipsProps = {
  variant: FilterVariant;
  buckets: BucketSummary[];
  categories: CategoryItem[];
  owners: FilterOwner[];
  sections?: Partial<SectionFlags>;
  hideDate?: boolean;
  hideSort?: boolean;
};

export function FilterChips({
  variant,
  buckets,
  categories,
  owners,
  sections: sectionsOverride,
  hideDate,
  hideSort,
}: FilterChipsProps) {
  const dispatch = useAppDispatch();
  const actions = ACTIONS[variant];
  const sections = resolveSections(variant, sectionsOverride);

  const sliceState = useAppSelector((s) => (s.filters as Record<string, any>)[variant]);
  const { filterCriteria, sortCriteria } = sliceState;

  const chips: React.ReactNode[] = [];

  const removeId = (
    set: (p: { preset: never; ids: string[] }) => unknown,
    ids: string[],
    id: string,
    fallbackClear?: () => unknown,
  ) => {
    const next = ids.filter((v) => v !== id);
    if (next.length === 0 && fallbackClear) {
      dispatch(fallbackClear() as never);
      return;
    }
    dispatch(set({ preset: "MULTIPLE" as never, ids: next }) as never);
  };

  const searchQuery = (filterCriteria as { q?: unknown }).q;
  if (sections.search && typeof searchQuery === "string" && searchQuery) {
    chips.push(
      <Chip
        key="search"
        label={`Search: ${searchQuery}`}
        ariaLabel={`Search filter: ${searchQuery}. Activate remove to clear.`}
        onRemove={actions.setSearch ? () => dispatch(actions.setSearch!(undefined)) : undefined}
      />,
    );
  }

  const { datePreset, customFrom, customTo } = filterCriteria as any;
  if (sections.date && !hideDate && datePreset) {
    const isCustom = datePreset === "CUSTOM";
    const clearDate = actions.clearDateFilter
      ? () => dispatch(actions.clearDateFilter!())
      : undefined;
    chips.push(
      <Chip
        key="date"
        label={isCustom ? customRangeLabel(customFrom, customTo) : presetLabel(datePreset)}
        onRemove={clearDate}
      />,
    );
  }

  if (sections.buckets) {
    const { bucketPreset, bucketIds = [] } = filterCriteria as any;
    // ids-only: bucketIds explicitly lists selected; ALL/PERSONAL presets map to muted All
    const isPresetAll = bucketPreset === "ALL" || bucketPreset === "PERSONAL";
    if (isPresetAll) {
      chips.push(<Chip key="bucket-all" label="All buckets" variant="muted" />);
    } else if (bucketIds.length === 0 || bucketIds.length === buckets.length) {
      // empty or all ids => All (muted, no remove)
      if (buckets.length > 0)
        chips.push(<Chip key="bucket-all" label="All buckets" variant="muted" />);
    } else {
      for (const id of bucketIds) {
        const bucket = buckets.find((b) => b._id === id);
        chips.push(
          <Chip
            key={`bucket-${id}`}
            label={bucket?.name ?? "Bucket"}
            icon={bucket?.icon ? <span aria-hidden="true">{bucket.icon}</span> : undefined}
            onRemove={() =>
              removeId(actions.setBucketFilter as never, bucketIds, id, actions.clearBucketFilter)
            }
          />,
        );
      }
    }
  }

  if (sections.categories) {
    const { categoryPreset, categoryIds = [] } = filterCriteria as any;
    const isPresetAll = categoryPreset === "ALL";
    if (isPresetAll) {
      chips.push(<Chip key="category-all" label="All categories" variant="muted" />);
    } else if (categoryIds.length === 0 || categoryIds.length === categories.length) {
      if (categories.length > 0)
        chips.push(<Chip key="category-all" label="All categories" variant="muted" />);
    } else {
      for (const id of categoryIds) {
        const category = categories.find((c) => c._id === id);
        chips.push(
          <Chip
            key={`category-${id}`}
            label={category?.name ?? "Category"}
            icon={category?.emoji ? <span aria-hidden="true">{category.emoji}</span> : undefined}
            onRemove={() =>
              removeId(
                actions.setCategoryFilter as never,
                categoryIds,
                id,
                actions.clearCategoryFilter,
              )
            }
          />,
        );
      }
    }
  }

  if (sections.owners) {
    const { ownerPreset, ownerIds = [] } = filterCriteria as any;
    const isPresetAll = ownerPreset === "ALL" || ownerPreset === "ME";
    if (isPresetAll) {
      chips.push(<Chip key="owner-all" label="All users" variant="muted" />);
    } else if (ownerIds.length === 0 || ownerIds.length === owners.length) {
      if (owners.length > 0) chips.push(<Chip key="owner-all" label="All users" variant="muted" />);
    } else {
      for (const id of ownerIds) {
        const owner = owners.find((o) => o.id === id);
        chips.push(
          <Chip
            key={`owner-${id}`}
            label={owner?.name ?? owner?.username ?? "User"}
            onRemove={() =>
              removeId(actions.setOwnerFilter as never, ownerIds, id, actions.clearOwnerFilter)
            }
          />,
        );
      }
    }
  }

  if (sections.sort && !hideSort && sortCriteria?.field) {
    const effectiveField = sortForVariant(variant, sortCriteria).field;
    const ascending = sortCriteria.direction === "ASC";
    chips.push(
      <Chip
        key="sort"
        variant="muted"
        label={
          <>
            {sortFieldLabel(variant, effectiveField)}{" "}
            <span aria-hidden="true">{ascending ? "↑" : "↓"}</span>
          </>
        }
        ariaLabel={`Sort by ${sortFieldLabel(variant, effectiveField)}, ${ascending ? "ascending" : "descending"}`}
        onRemove={actions.clearSort ? () => dispatch(actions.clearSort!()) : undefined}
      />,
    );
  }

  if (sections.additional) {
    const { hasNotes, hasLocation } = filterCriteria as any;
    const clearAdditional = actions.clearAdditionalFilters;
    if (hasNotes !== undefined) {
      chips.push(
        <Chip
          key="has-notes"
          label={hasNotes ? "Has notes" : "No notes"}
          onRemove={
            actions.setHasNotes
              ? () => dispatch(actions.setHasNotes!(undefined))
              : clearAdditional
                ? () => dispatch(clearAdditional())
                : undefined
          }
        />,
      );
    }
    if (hasLocation !== undefined) {
      chips.push(
        <Chip
          key="has-location"
          label={hasLocation ? "Has location" : "No location"}
          onRemove={
            actions.setHasLocation
              ? () => dispatch(actions.setHasLocation!(undefined))
              : clearAdditional
                ? () => dispatch(clearAdditional())
                : undefined
          }
        />,
      );
    }
  }

  return <>{chips}</>;
}
