"use client";

import { useState } from "react";

import { ConfirmDialog, Modal } from "@/components/modals/dialog";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { AdditionalFiltersSection } from "./additional-filters-section";
import { BucketCategoryFilterSection } from "./bucket-category-filter-section";
import { DateFilterSection } from "./date-filter-section";
import { OwnerFilterSection } from "./owner-filter-section";
import { SearchSection } from "./search-section";
import { SortSection } from "./sort-section";
import { useAllBucketCategories, useScopedOptions } from "./use-scoped-options";
import {
  ACTIONS,
  SORT_FIELDS,
  VARIANT_TITLE,
  defaultSort,
  resolveSections,
  sortForVariant,
  type DraftCriteria,
  type FilterVariant,
  type SectionFlags,
} from "./variants";
import type { SortCriteria } from "@/constants/types/search.types";

type FilterDialogProps = {
  variant: FilterVariant;
  open: boolean;
  onClose: () => void;
  sections?: Partial<SectionFlags>;
};

export function FilterDialog({
  variant,
  open,
  onClose,
  sections: sectionsOverride,
}: FilterDialogProps) {
  const dispatch = useAppDispatch();
  const actions = ACTIONS[variant];
  const sections = resolveSections(variant, sectionsOverride);

  const sliceState = useAppSelector((s) => (s.filters as Record<string, any>)[variant]);
  const state = sliceState;
  const buckets = useAppSelector((s) => s.buckets.allBuckets);
  const authUser = useAppSelector((s) => s.auth.user);

  const [confirmClear, setConfirmClear] = useState(false);

  const [draft, setDraft] = useState({
    open,
    criteria: state.filterCriteria as DraftCriteria,
    sort: sortForVariant(variant, state.sortCriteria),
  });
  if (draft.open !== open) {
    setDraft({
      open,
      criteria: state.filterCriteria as DraftCriteria,
      sort: sortForVariant(variant, state.sortCriteria),
    });
  }
  const { criteria, sort } = draft;
  const setCriteria = (updater: (c: DraftCriteria) => DraftCriteria) =>
    setDraft((d) => ({ ...d, criteria: updater(d.criteria) }));
  const setSort = (next: SortCriteria) => setDraft((d) => ({ ...d, sort: next }));

  // all bucket categories (for nested list, always load when either buckets or categories section is visible)
  const allBucketCats = useAllBucketCategories(
    open && (sections.buckets || sections.categories),
    buckets,
  );
  // effective ids for scoped owners (ids-only, empty => all? keep legacy compat)
  const effectiveBucketIdsForOwners = (() => {
    const preset = (criteria as any).bucketPreset;
    const ids = (criteria as any).bucketIds as string[] | undefined;
    if (preset === "PERSONAL") {
      const pid = buckets.find((b) => b.isPersonal)?._id;
      return pid ? [pid] : (ids ?? []);
    }
    if (preset === "ALL") return buckets.map((b) => b._id);
    if (ids && ids.length > 0) return ids;
    // legacy empty MULTIPLE or ALL without preset => treat as all
    return buckets.map((b) => b._id);
  })();

  const scoped = useScopedOptions(
    open && sections.owners,
    buckets,
    undefined,
    effectiveBucketIdsForOwners,
  );

  const patch = (next: Partial<DraftCriteria>) => setCriteria((c) => ({ ...c, ...next }));

  // helpers to normalize draft ids to explicit lists (ids-only, no preset)
  const effectiveBucketIds = (() => {
    const preset = (criteria as any).bucketPreset;
    const ids = (criteria as any).bucketIds as string[] | undefined;
    if (preset === "PERSONAL") {
      const pid = buckets.find((b) => b.isPersonal)?._id;
      return pid ? [pid] : [];
    }
    if (preset === "ALL") return buckets.map((b) => b._id);
    if (ids && ids.length > 0) return ids;
    // ids-only empty => none? but for initial legacy state (empty+ALL) we mapped above; fallback to personal
    if (buckets.length > 0 && (!ids || ids.length === 0) && preset === undefined) {
      // treat empty ids as all buckets for display before user interacts
      return buckets.map((b) => b._id);
    }
    return ids ?? [];
  })();

  const effectiveCategoryIds = (() => {
    const preset = (criteria as any).categoryPreset;
    const ids = (criteria as any).categoryIds as string[] | undefined;
    if (preset === "ALL") {
      return [
        ...new Set(
          Object.values(allBucketCats.categoriesByBucket)
            .flat()
            .map((c) => c._id),
        ),
      ];
    }
    return ids ?? [];
  })();

  const effectiveOwnerIds = (() => {
    const preset = (criteria as any).ownerPreset;
    const ids = (criteria as any).ownerIds as string[] | undefined;
    if (preset === "ME") return authUser?.id ? [authUser.id] : [];
    if (preset === "ALL") return scoped.owners.map((o) => o.id);
    return ids ?? [];
  })();

  const bucketCategoryLoading = allBucketCats.isLoading || scoped.isLoading;

  const apply = () => {
    // ids-only: always MULTIPLE (preset is legacy, we force MULTIPLE)
    const showBuckets = sections.buckets || sections.categories;
    if (showBuckets && actions.setBucketFilter) {
      dispatch(
        actions.setBucketFilter({
          preset: "MULTIPLE",
          ids: effectiveBucketIds,
        }),
      );
    }
    if (sections.categories && actions.setCategoryFilter) {
      dispatch(
        actions.setCategoryFilter({
          preset: "MULTIPLE",
          ids: effectiveCategoryIds,
        }),
      );
    }
    if (sections.owners && actions.setOwnerFilter) {
      dispatch(
        actions.setOwnerFilter({
          preset: "MULTIPLE",
          ids: effectiveOwnerIds,
        }),
      );
    }
    if (sections.date && actions.setDateFilter) {
      dispatch(
        actions.setDateFilter({
          preset: criteria.datePreset,
          customFrom: criteria.customFrom,
          customTo: criteria.customTo,
        }),
      );
    }
    if (sections.search && actions.setSearch) {
      dispatch(actions.setSearch(criteria.q));
    }
    if (sections.additional) {
      if (actions.setHasNotes) dispatch(actions.setHasNotes(criteria.hasNotes));
      if (actions.setHasLocation) dispatch(actions.setHasLocation(criteria.hasLocation));
    }
    if (sections.sort && actions.setSort) dispatch(actions.setSort(sort));
    onClose();
  };

  const clearAll = () => {
    // ponytail: clear to personal bucket + its categories (ids-only), not preset ALL
    const personalId = buckets.find((b) => b.isPersonal)?._id ?? buckets[0]?._id;
    if (personalId) {
      const personalCatIds = (allBucketCats.categoriesByBucket[personalId] ?? []).map((c) => c._id);
      if (actions.setBucketFilter)
        dispatch(actions.setBucketFilter({ preset: "MULTIPLE", ids: [personalId] }));
      if (sections.categories && actions.setCategoryFilter)
        dispatch(actions.setCategoryFilter({ preset: "MULTIPLE", ids: personalCatIds }));
      else if (actions.setCategoryFilter)
        dispatch(actions.setCategoryFilter({ preset: "MULTIPLE", ids: [] }));
    } else {
      if (actions.clearBucketFilter) dispatch(actions.clearBucketFilter());
      if (actions.clearCategoryFilter) dispatch(actions.clearCategoryFilter());
    }
    if (sections.owners && actions.setOwnerFilter) {
      const meId = authUser?.id;
      if (meId) dispatch(actions.setOwnerFilter({ preset: "MULTIPLE", ids: [meId] }));
      else if (actions.clearOwnerFilter) dispatch(actions.clearOwnerFilter());
    } else if (actions.clearOwnerFilter) {
      dispatch(actions.clearOwnerFilter());
    }
    if (sections.date && actions.clearDateFilter) dispatch(actions.clearDateFilter());
    if (sections.search && actions.setSearch) dispatch(actions.setSearch(undefined));
    if (sections.additional && actions.clearAdditionalFilters)
      dispatch(actions.clearAdditionalFilters());
    if (sections.sort && actions.clearSort) dispatch(actions.clearSort());
    setConfirmClear(false);
    onClose();
  };

  const handleBucketCategoryClear = () => {
    const personalId = buckets.find((b) => b.isPersonal)?._id ?? buckets[0]?._id;
    if (!personalId) {
      patch({
        bucketPreset: "MULTIPLE" as any,
        bucketIds: [] as any,
        categoryPreset: "MULTIPLE" as any,
        categoryIds: [] as any,
      });
      return;
    }
    const personalCatIds = (allBucketCats.categoriesByBucket[personalId] ?? []).map((c) => c._id);
    patch({
      bucketPreset: "MULTIPLE" as any,
      bucketIds: [personalId] as any,
      categoryPreset: "MULTIPLE" as any,
      categoryIds: personalCatIds as any,
    });
  };

  return (
    <>
      <Modal
        open={open}
        title={VARIANT_TITLE[variant]}
        subtitle="Narrow down what you see"
        onClose={onClose}
      >
        <div className="space-y-5">
          {sections.search ? (
            <SearchSection
              q={criteria.q ?? ""}
              onChange={(q) => setCriteria((c) => ({ ...c, q: q || undefined }))}
            />
          ) : null}

          {sections.owners ? (
            <OwnerFilterSection
              ownerIds={effectiveOwnerIds}
              owners={scoped.owners}
              isLoading={scoped.isLoading}
              onChange={(ids) => patch({ ownerPreset: "MULTIPLE" as any, ownerIds: ids as any })}
              onClear={() => {
                const meId = authUser?.id;
                patch({ ownerPreset: "MULTIPLE" as any, ownerIds: (meId ? [meId] : []) as any });
              }}
            />
          ) : null}

          {sections.buckets || sections.categories ? (
            <BucketCategoryFilterSection
              buckets={buckets}
              bucketIds={effectiveBucketIds}
              categoryIds={effectiveCategoryIds}
              categoriesByBucket={allBucketCats.categoriesByBucket}
              isLoading={bucketCategoryLoading}
              categoriesEnabled={!!sections.categories}
              onBucketIdsChange={(ids) =>
                patch({ bucketPreset: "MULTIPLE" as any, bucketIds: ids as any })
              }
              onCategoryIdsChange={(ids) =>
                patch({ categoryPreset: "MULTIPLE" as any, categoryIds: ids as any })
              }
              onClear={handleBucketCategoryClear}
            />
          ) : null}

          {sections.date ? (
            <DateFilterSection
              preset={criteria.datePreset}
              customFrom={criteria.customFrom}
              customTo={criteria.customTo}
              onChange={({ preset, customFrom, customTo }) =>
                setCriteria((c) => ({ ...c, datePreset: preset, customFrom, customTo }))
              }
              onClear={() =>
                setCriteria((c) => ({
                  ...c,
                  datePreset: "THIS_MONTH",
                  customFrom: undefined,
                  customTo: undefined,
                }))
              }
              defaultOpen={true}
            />
          ) : null}

          {sections.sort ? (
            <SortSection
              field={sort.field}
              direction={sort.direction}
              fields={SORT_FIELDS[variant]}
              onChange={setSort}
              onClear={() => setSort(defaultSort(variant))}
              defaultOpen={false}
            />
          ) : null}

          {sections.additional ? (
            <AdditionalFiltersSection
              hasNotes={criteria.hasNotes}
              hasLocation={criteria.hasLocation}
              onChange={({ hasNotes, hasLocation }) =>
                setCriteria((c) => ({ ...c, hasNotes, hasLocation }))
              }
              onClear={() =>
                setCriteria((c) => ({ ...c, hasNotes: undefined, hasLocation: undefined }))
              }
              defaultOpen={false}
            />
          ) : null}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="ghost" onClick={() => setConfirmClear(true)}>
              Clear all
            </Button>
            <Button type="button" onClick={apply}>
              Apply
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmClear}
        title="Clear all filters"
        subtitle="This resets every filter"
        description="All selected buckets, categories, users, dates and sorting will be reset to their defaults."
        onConfirm={clearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  );
}
