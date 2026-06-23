"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangeSelect } from "@/components/charts/date-range-select";
import { rangePeriodLabel } from "@/lib/date-range";
import type { GlobalDateRange } from "@/lib/date-range";

type DateRangeBarProps = {
	title?: string;
	range: GlobalDateRange;
	onRangeChange: (range: GlobalDateRange) => void;
	loading?: boolean;
};

export function DateRangeBar({
	title: externalTitle,
	range,
	onRangeChange,
	loading,
}: DateRangeBarProps) {
	const computedTitle = useMemo(
		() => rangePeriodLabel(range),
		[range],
	);

	const title = externalTitle ?? computedTitle;

	return (
		<div className="flex items-center justify-between flex-wrap gap-2 px-2">
			{loading ? (
				<Skeleton className="h-5 w-32" />
			) : (
				<h3 className="text-base font-semibold tracking-tight">
					{title}
				</h3>
			)}
			<DateRangeSelect
				value={range}
				onChange={onRangeChange}
				loading={loading}
			/>
		</div>
	);
}
