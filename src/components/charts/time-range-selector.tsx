"use client";

import { useState } from "react";

type Preset =
	| "this_week"
	| "this_month"
	| "this_year"
	| "custom";

type Props = {
	value?: Preset;
	onChange?: (
		value: Preset,
		from?: string,
		to?: string,
	) => void;
};

export function TimeRangeSelector({
	value = "this_month",
	onChange,
}: Props) {
	const [preset, setPreset] = useState<Preset>(value);
	const [from, setFrom] = useState<string>("");
	const [to, setTo] = useState<string>("");

	const apply = () => {
		setPreset((p) => p);
		onChange?.(preset, from || undefined, to || undefined);
	};

	return (
		<div className="flex items-center gap-2">
			<div className="flex gap-1">
				<button
					type="button"
					className={`px-2 py-1 rounded text-sm ${preset === "this_week" ? "bg-emerald-600 text-white" : "border"}`}
					onClick={() => {
						setPreset("this_week");
						onChange?.("this_week");
					}}
				>
					This Week
				</button>
				<button
					type="button"
					className={`px-2 py-1 rounded text-sm ${preset === "this_month" ? "bg-emerald-600 text-white" : "border"}`}
					onClick={() => {
						setPreset("this_month");
						onChange?.("this_month");
					}}
				>
					This Month
				</button>
				<button
					type="button"
					className={`px-2 py-1 rounded text-sm ${preset === "this_year" ? "bg-emerald-600 text-white" : "border"}`}
					onClick={() => {
						setPreset("this_year");
						onChange?.("this_year");
					}}
				>
					This Year
				</button>
				<button
					type="button"
					className={`px-2 py-1 rounded text-sm ${preset === "custom" ? "bg-emerald-600 text-white" : "border"}`}
					onClick={() => setPreset("custom")}
				>
					Custom
				</button>
			</div>

			{preset === "custom" && (
				<div className="flex items-center gap-2">
					<input
						type="date"
						value={from}
						onChange={(e) => setFrom(e.target.value)}
						className="rounded border px-2 py-1 text-sm"
					/>
					<span className="text-sm">—</span>
					<input
						type="date"
						value={to}
						onChange={(e) => setTo(e.target.value)}
						className="rounded border px-2 py-1 text-sm"
					/>
					<button
						type="button"
						onClick={apply}
						className="ml-2 rounded bg-emerald-600 px-3 py-1 text-sm text-white"
					>
						Apply
					</button>
				</div>
			)}
		</div>
	);
}
