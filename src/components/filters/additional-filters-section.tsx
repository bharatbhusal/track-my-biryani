"use client";

import { Select } from "@/components/ui/select";
import { FilterSection } from "./section";
import { additionalSummary } from "./section-summary";

type AdditionalChange = {
	hasNotes?: boolean;
	hasLocation?: boolean;
};

type AdditionalFiltersSectionProps = AdditionalChange & {
	onChange: (next: AdditionalChange) => void;
	onClear: () => void;
	defaultOpen?: boolean;
};

// ponytail: a native tri-state <select> beats a custom three-way toggle widget.
const OPTIONS = [
	{ value: "", label: "Any" },
	{ value: "yes", label: "Yes" },
	{ value: "no", label: "No" },
];

function toValue(v: boolean | undefined): string {
	return v === undefined ? "" : v ? "yes" : "no";
}

function fromValue(v: string): boolean | undefined {
	return v === "" ? undefined : v === "yes";
}

export function AdditionalFiltersSection({
	hasNotes,
	hasLocation,
	onChange,
	onClear,
	defaultOpen,
}: AdditionalFiltersSectionProps) {
	return (
		<FilterSection
			title="Additional"
			onClear={onClear}
			defaultOpen={defaultOpen}
			summary={additionalSummary(hasNotes, hasLocation)}
		>
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
				<label className="space-y-1">
					<span className="text-xs text-[var(--color-muted)]">Has notes</span>
					<Select
						value={toValue(hasNotes)}
						onChange={(e) =>
							onChange({ hasNotes: fromValue(e.target.value), hasLocation })
						}
					>
						{OPTIONS.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</Select>
				</label>
				<label className="space-y-1">
					<span className="text-xs text-[var(--color-muted)]">
						Has location
					</span>
					<Select
						value={toValue(hasLocation)}
						onChange={(e) =>
							onChange({ hasNotes, hasLocation: fromValue(e.target.value) })
						}
					>
						{OPTIONS.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</Select>
				</label>
			</div>
		</FilterSection>
	);
}
