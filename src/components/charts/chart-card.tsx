"use client";

import { type ReactNode } from "react";
import { Card, CardTitle } from "@/components/ui/card";
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
}: ChartCardProps) {
	return (
		<Card className={className}>
			<div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
				<CardTitle>{title}</CardTitle>
			</div>
			{children}
		</Card>
	);
}
