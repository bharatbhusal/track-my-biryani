"use client";

import { Select } from "@/components/ui/select";
import type { DateRangePreset } from "@/lib/date-range";

type Props = {
	value: DateRangePreset;
	onChange: (value: DateRangePreset) => void;
	className?: string;
};

export function TimeRangeSelector({
	value,
	onChange,
	className,
}: Props) {
	return (
		<Select
			aria-label="Global time range"
			className={className}
			value={value}
			onChange={(event) =>
				onChange(event.target.value as DateRangePreset)
			}
		>
			<option value="this_week">This Week</option>
			<option value="this_month">This Month</option>
			<option value="this_year">This Year</option>
			<option value="custom">Custom...</option>
		</Select>
	);
}
