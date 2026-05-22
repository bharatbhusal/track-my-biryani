"use client";

import { useMemo } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

type DateTimePickerProps = {
	value: string;
	onChange: (value: string) => void;
	id?: string;
};

function toDate(value: string): Date | undefined {
	if (!value) return undefined;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

export function DateTimePicker({
	value,
	onChange,
	id,
}: DateTimePickerProps) {
	const selectedDate = useMemo(() => toDate(value), [value]);
	const timePart = value?.slice(11, 16) || "12:00";

	return (
		<div className="space-y-2">
			<Popover>
				<PopoverTrigger asChild>
					<Button
						id={id}
						type="button"
						variant="outline"
						className="w-full justify-start text-left font-normal"
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{selectedDate ? (
							format(selectedDate, "PPP")
						) : (
							<span>Select date</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={selectedDate}
						onSelect={(nextDate) => {
							if (!nextDate) return;
							const [hours, minutes] = timePart
								.split(":")
								.map(Number);
							nextDate.setHours(hours || 0, minutes || 0, 0, 0);
							onChange(
								new Date(
									nextDate.getTime() -
										nextDate.getTimezoneOffset() * 60000,
								)
									.toISOString()
									.slice(0, 16),
							);
						}}
					/>
				</PopoverContent>
			</Popover>
			<Input
				type="time"
				value={timePart}
				onChange={(event) => {
					const [hours, minutes] = event.target.value
						.split(":")
						.map(Number);
					const base = selectedDate ?? new Date();
					base.setHours(hours || 0, minutes || 0, 0, 0);
					onChange(
						new Date(
							base.getTime() - base.getTimezoneOffset() * 60000,
						)
							.toISOString()
							.slice(0, 16),
					);
				}}
			/>
		</div>
	);
}
