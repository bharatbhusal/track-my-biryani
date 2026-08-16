"use client";

import { Chip } from "@/components/ui/chip";
import { MultiSelect } from "@/components/ui/multi-select";
import { FilterSection } from "./section";
import type { BucketPreset } from "@/types/search.types";
import type { BucketSummary } from "@/types/bucket.types";
import { bucketSummary } from "./section-summary";

type BucketFilterSectionProps = {
	preset: BucketPreset;
	bucketIds: string[];
	buckets: BucketSummary[];
	onChange: (next: { preset: BucketPreset; ids: string[] }) => void;
	onClear: () => void;
	isLoading?: boolean;
	defaultOpen?: boolean;
};

export function BucketFilterSection({
	preset,
	bucketIds,
	buckets,
	onChange,
	onClear,
	isLoading,
	defaultOpen,
}: BucketFilterSectionProps) {
	return (
		<FilterSection
			title="Buckets"
			onClear={onClear}
			isLoading={isLoading}
			defaultOpen={defaultOpen}
			summary={bucketSummary(preset, bucketIds, buckets)}
		>
			<div className="flex flex-wrap gap-2">
				<Chip
					label="Personal"
					variant={preset === "PERSONAL" ? "default" : "muted"}
					onClick={() => onChange({ preset: "PERSONAL", ids: [] })}
				/>
			</div>
			<MultiSelect
				allLabel="All buckets"
				emptyLabel="No buckets yet"
				isAll={preset === "ALL"}
				onAllChange={(isAll) =>
					onChange({ preset: isAll ? "ALL" : "MULTIPLE", ids: [] })
				}
				selected={preset === "MULTIPLE" ? bucketIds : []}
				onChange={(ids) => onChange({ preset: "MULTIPLE", ids })}
				options={buckets.map((b) => ({
					value: b._id,
					label: b.name,
					icon: b.icon,
				}))}
			/>
		</FilterSection>
	);
}
