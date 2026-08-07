"use client";

import * as React from "react";

import { Select } from "@/components/ui/select";

export type DropdownOption = {
	value: string;
	label: string;
	icon?: string;
};

type DropdownListProps = Omit<
	React.SelectHTMLAttributes<HTMLSelectElement>,
	"value" | "onChange" | "children"
> & {
	options: DropdownOption[];
	value: string;
	onValueChange: (value: string) => void;
	placeholder?: string;
	addLabel?: string;
	onAddNew?: () => void;
};

const ADD_NEW_VALUE = "__add_new__";

export function DropdownList({
	options,
	value,
	onValueChange,
	placeholder,
	addLabel,
	onAddNew,
	className,
	...rest
}: DropdownListProps) {
	return (
		<Select
			className={className}
			value={value}
			onChange={(e) => {
				const next = e.target.value;
				if (next === ADD_NEW_VALUE) {
					e.target.value = value;
					onAddNew?.();
					return;
				}
				onValueChange(next);
			}}
			{...rest}
		>
			{placeholder !== undefined && (
				<option value="">{placeholder}</option>
			)}
			{options.map((option) => (
				<option key={option.value} value={option.value}>
					{option.icon
						? `${option.icon} ${option.label}`
						: option.label}
				</option>
			))}
			{addLabel && onAddNew && (
				<option value={ADD_NEW_VALUE}>+ {addLabel}</option>
			)}
		</Select>
	);
}
