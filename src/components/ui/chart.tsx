"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<
	string,
	{
		label: string;
		color: string;
	}
>;

const ChartContext = React.createContext<ChartConfig | null>(null);

export function ChartContainer({
	config,
	className,
	children,
}: React.ComponentProps<"div"> & {
	config: ChartConfig;
}) {
	return (
		<ChartContext.Provider value={config}>
			<div className={cn("w-full", className)}>{children}</div>
		</ChartContext.Provider>
	);
}

export function useChartConfig() {
	const context = React.useContext(ChartContext);
	if (!context) {
		throw new Error("useChartConfig must be used inside ChartContainer");
	}
	return context;
}
