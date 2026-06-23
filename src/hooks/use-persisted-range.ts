/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback } from "react";
import {
	loadPersistedRange,
	persistRange,
	DEFAULT_GLOBAL_RANGE,
} from "@/lib/date-range";
import type { GlobalDateRange } from "@/lib/date-range";

export function usePersistedRange() {
	const [range, setRange] = useState<GlobalDateRange>(DEFAULT_GLOBAL_RANGE);

	useEffect(() => {
		const persisted = loadPersistedRange();
		setRange(persisted);
	}, []);

	const updateRange = useCallback((r: GlobalDateRange) => {
		setRange(r);
		persistRange(r);
	}, []);

	return [range, updateRange] as const;
}
