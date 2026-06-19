"use client";

import { useState, useEffect, useCallback } from "react";
import {
	loadPersistedRange,
	persistRange,
	DEFAULT_GLOBAL_RANGE,
} from "@/lib/date-range";
import type { GlobalDateRange } from "@/lib/date-range";

export function usePersistedRange() {
	const [range, setRange] = useState<GlobalDateRange>(
		() =>
			typeof window !== "undefined"
				? loadPersistedRange()
				: DEFAULT_GLOBAL_RANGE,
	);

	useEffect(() => {
		persistRange(range);
	}, [range]);

	const updateRange = useCallback((r: GlobalDateRange) => setRange(r), []);

	return [range, updateRange] as const;
}
