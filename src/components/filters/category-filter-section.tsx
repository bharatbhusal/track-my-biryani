"use client";

import { MultiSelect } from "@/components/ui/multi-select";
import { FilterSection } from "./section";
import type { CategoryPreset } from "@/types/search.types";
import type { CategoryItem } from "@/types/expense.types";
import { categorySummary } from "./section-summary";

type CategoryFilterSectionProps = {
  preset: CategoryPreset;
  categoryIds: string[];
  categories: CategoryItem[];
  onChange: (next: { preset: CategoryPreset; ids: string[] }) => void;
  onClear: () => void;
  isLoading?: boolean;
  defaultOpen?: boolean;
};

export function CategoryFilterSection({
  preset,
  categoryIds,
  categories,
  onChange,
  onClear,
  isLoading,
  defaultOpen,
}: CategoryFilterSectionProps) {
  return (
    <FilterSection
      title="Categories"
      onClear={onClear}
      isLoading={isLoading}
      defaultOpen={defaultOpen}
      summary={categorySummary(preset, categoryIds, categories)}
    >
      <MultiSelect
        allLabel="All categories"
        emptyLabel={isLoading ? "Loading categories…" : "No categories in the selected buckets"}
        isAll={preset === "ALL"}
        onAllChange={(isAll) => onChange({ preset: isAll ? "ALL" : "MULTIPLE", ids: [] })}
        selected={preset === "MULTIPLE" ? categoryIds : []}
        onChange={(ids) => onChange({ preset: "MULTIPLE", ids })}
        options={categories.map((c) => ({
          value: c._id,
          label: c.name,
          icon: c.emoji,
        }))}
      />
    </FilterSection>
  );
}
