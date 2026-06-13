"use client";

import { useState } from "react";
import type { GlobalDateRange } from "@/lib/date-range";
import { DEFAULT_GLOBAL_RANGE } from "@/lib/date-range";

export function useDateRange(initial?: GlobalDateRange) {
	const [range, setRange] = useState<GlobalDateRange>(
		initial ?? DEFAULT_GLOBAL_RANGE,
	);
	return { range, setRange };
}
