"use client";

import { Chip } from "@/components/ui/chip";
import { MultiSelect } from "@/components/ui/multi-select";
import { FilterSection } from "./section";
import type { OwnerPreset } from "@/types/search.types";
import { ownerSummary } from "./section-summary";

export type FilterOwner = {
	id: string;
	name: string;
	username: string;
};

type OwnerFilterSectionProps = {
	preset: OwnerPreset;
	ownerIds: string[];
	owners: FilterOwner[];
	onChange: (next: { preset: OwnerPreset; ids: string[] }) => void;
	onClear: () => void;
	isLoading?: boolean;
	defaultOpen?: boolean;
};

export function OwnerFilterSection({
	preset,
	ownerIds,
	owners,
	onChange,
	onClear,
	isLoading,
	defaultOpen,
}: OwnerFilterSectionProps) {
	return (
		<FilterSection
			title="Posted by"
			onClear={onClear}
			isLoading={isLoading}
			defaultOpen={defaultOpen}
			summary={ownerSummary(preset, ownerIds, owners)}
		>
			<div className="flex flex-wrap gap-2">
				<Chip
					label="Me"
					variant={preset === "ME" ? "default" : "muted"}
					onClick={() => onChange({ preset: "ME", ids: [] })}
				/>
			</div>
			<MultiSelect
				allLabel="All users"
				emptyLabel={
					isLoading
						? "Loading users…"
						: "No members in the selected buckets"
				}
				isAll={preset === "ALL"}
				onAllChange={(isAll) =>
					onChange({ preset: isAll ? "ALL" : "MULTIPLE", ids: [] })
				}
				selected={preset === "MULTIPLE" ? ownerIds : []}
				onChange={(ids) => onChange({ preset: "MULTIPLE", ids })}
				options={owners.map((o) => ({
					value: o.id,
					label: o.name || o.username,
				}))}
			/>
		</FilterSection>
	);
}
