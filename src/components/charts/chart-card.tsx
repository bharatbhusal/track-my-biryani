"use client";

import { useState, type ReactNode } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { DateRangeSelect } from "@/components/charts/date-range-select";
import { usePersistedRange } from "@/hooks/use-persisted-range";
import type { GlobalDateRange } from "@/lib/date-range";

type ChartCardProps = {
	title: string;
	children: ReactNode;
	className?: string;
	range?: GlobalDateRange;
	onRangeChange?: (range: GlobalDateRange) => void;
};

export function ChartCard({
	title,
	children,
	className = "",
	range: externalRange,
	onRangeChange,
}: ChartCardProps) {
	const [internalRange, setInternalRange] = usePersistedRange();

	const range = externalRange ?? internalRange;
	const handleRangeChange = (newRange: GlobalDateRange) => {
		if (!externalRange) setInternalRange(newRange);
		onRangeChange?.(newRange);
	};

	return (
		<Card className={className}>
			<div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
				<CardTitle>{title}</CardTitle>
				{onRangeChange && (
					<DateRangeSelect
						value={range}
						onChange={handleRangeChange}
					/>
				)}
			</div>
			{children}
		</Card>
	);
}
