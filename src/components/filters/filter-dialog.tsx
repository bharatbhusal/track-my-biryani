"use client";

import { useState } from "react";

import { ConfirmDialog, Modal } from "@/components/modals/dialog";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { AdditionalFiltersSection } from "./additional-filters-section";
import { BucketFilterSection } from "./bucket-filter-section";
import { CategoryFilterSection } from "./category-filter-section";
import { DateFilterSection } from "./date-filter-section";
import { OwnerFilterSection } from "./owner-filter-section";
import { SearchSection } from "./search-section";
import { SortSection } from "./sort-section";
import { useScopedOptions } from "./use-scoped-options";
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
import type { SortCriteria } from "@/types/search.types";

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

  const scoped = useScopedOptions(
    open && (sections.categories || sections.owners),
    buckets,
    criteria.bucketPreset as any,
    criteria.bucketIds as any,
  );

  const patch = (next: Partial<DraftCriteria>) => setCriteria((c) => ({ ...c, ...next }));

  const apply = () => {
    if (sections.buckets && actions.setBucketFilter) {
      dispatch(
        actions.setBucketFilter({
          preset: (criteria.bucketPreset as any) ?? "PERSONAL",
          ids: (criteria.bucketIds as any) ?? [],
        }),
      );
    }
    if (sections.categories && actions.setCategoryFilter) {
      dispatch(
        actions.setCategoryFilter({
          preset: (criteria.categoryPreset as any) ?? "ALL",
          ids: (criteria.categoryIds as any) ?? [],
        }),
      );
    }
    if (sections.owners && actions.setOwnerFilter) {
      dispatch(
        actions.setOwnerFilter({
          preset: (criteria.ownerPreset as any) ?? "ME",
          ids: (criteria.ownerIds as any) ?? [],
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
    if (actions.clearAllFilters) {
      dispatch(actions.clearAllFilters());
    }
    setConfirmClear(false);
    onClose();
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

          {sections.buckets ? (
            <BucketFilterSection
              preset={(criteria.bucketPreset as any) ?? "PERSONAL"}
              bucketIds={(criteria.bucketIds as any) ?? []}
              buckets={buckets}
              onChange={({ preset, ids }) =>
                patch({ bucketPreset: preset as any, bucketIds: ids as any })
              }
              onClear={() => patch({ bucketPreset: "PERSONAL" as any, bucketIds: [] as any })}
              defaultOpen={false}
            />
          ) : null}

          {sections.categories ? (
            <CategoryFilterSection
              preset={(criteria.categoryPreset as any) ?? "ALL"}
              categoryIds={(criteria.categoryIds as any) ?? []}
              categories={scoped.categories}
              isLoading={scoped.isLoading}
              onChange={({ preset, ids }) =>
                patch({ categoryPreset: preset as any, categoryIds: ids as any })
              }
              onClear={() => patch({ categoryPreset: "ALL" as any, categoryIds: [] as any })}
              defaultOpen={false}
            />
          ) : null}

          {sections.owners ? (
            <OwnerFilterSection
              preset={(criteria.ownerPreset as any) ?? "ME"}
              ownerIds={(criteria.ownerIds as any) ?? []}
              owners={scoped.owners}
              isLoading={scoped.isLoading}
              onChange={({ preset, ids }) =>
                patch({ ownerPreset: preset as any, ownerIds: ids as any })
              }
              onClear={() => patch({ ownerPreset: "ME" as any, ownerIds: [] as any })}
              defaultOpen={false}
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
