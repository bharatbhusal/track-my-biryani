"use client";

import { useState, type ReactNode } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { DateRangeSelect } from "@/components/charts/date-range-select";
import type { GlobalDateRange } from "@/lib/date-range";
import { DEFAULT_GLOBAL_RANGE } from "@/lib/date-range";

type ChartCardProps = {
	title: string;
	children: ReactNode;
	className?: string;
	defaultRange?: GlobalDateRange;
	onRangeChange?: (range: GlobalDateRange) => void;
};

export function ChartCard({
	title,
	children,
	className = "",
	defaultRange = DEFAULT_GLOBAL_RANGE,
	onRangeChange,
}: ChartCardProps) {
	const [range, setRange] =
		useState<GlobalDateRange>(defaultRange);

	const handleRangeChange = (newRange: GlobalDateRange) => {
		setRange(newRange);
		onRangeChange?.(newRange);
	};

	return (
		<Card className={className}>
			<div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
				<CardTitle>{title}</CardTitle>
				<DateRangeSelect
					value={range}
					onChange={handleRangeChange}
				/>
			</div>
			{children}
		</Card>
	);
}
