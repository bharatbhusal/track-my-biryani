"use client";

import React, {
	createContext,
	useContext,
	useState,
} from "react";
import type { GlobalDateRange } from "@/lib/date-range";
import { DEFAULT_GLOBAL_RANGE } from "@/lib/date-range";

type SharedRanges = Record<string, GlobalDateRange>;

type DateRangeContextValue = {
	shared: SharedRanges;
	setSharedRange: (
		group: string,
		range: GlobalDateRange,
	) => void;
};

const DateRangeContext =
	createContext<DateRangeContextValue | null>(null);

export function DateRangeProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [shared, setShared] = useState<SharedRanges>({});

	const setSharedRange = (
		group: string,
		range: GlobalDateRange,
	) => {
		setShared((s) => ({ ...s, [group]: range }));
	};

	return (
		<DateRangeContext.Provider
			value={{ shared, setSharedRange }}
		>
			{children}
		</DateRangeContext.Provider>
	);
}

type UseDateRangeOptions = {
	syncGroup?: string;
	initial?: GlobalDateRange;
};

export function useDateRange({
	syncGroup,
	initial,
}: UseDateRangeOptions = {}) {
	const ctx = useContext(DateRangeContext);

	const defaultRange = initial ?? DEFAULT_GLOBAL_RANGE;

	if (syncGroup && ctx) {
		const groupRange = ctx.shared[syncGroup] ?? defaultRange;
		const setRange = (r: GlobalDateRange) =>
			ctx.setSharedRange(syncGroup, r);
		return { range: groupRange, setRange };
	}

	const [range, setRange] =
		useState<GlobalDateRange>(defaultRange);
	return { range, setRange };
}

export default DateRangeContext;
