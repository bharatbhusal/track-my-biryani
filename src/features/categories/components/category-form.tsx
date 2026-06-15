"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTheme } from "next-themes";
import { Theme } from "emoji-picker-react";
import { FiPlus, FiSave } from "react-icons/fi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useExpenseMutations } from "@/hooks/api/use-expenses-api";
import type { CategoryItem } from "@/types/expense.types";

const EmojiPicker = dynamic(
	() => import("emoji-picker-react"),
	{
		ssr: false,
	},
);

function randomColor(): string {
	const hue = Math.floor(Math.random() * 360);
	return `hsl(${hue}, 65%, 55%)`;
}

type FormValues = {
	name: string;
	color: string;
	emoji: string;
};

type CategoryFormProps = {
	category?: CategoryItem | null;
	onSuccess?: () => void;
	onCancel?: () => void;
};

export function CategoryForm({
	category,
	onSuccess,
	onCancel,
}: CategoryFormProps) {
	const [pickerOpen, setPickerOpen] = useState(false);
	const { createCategory, updateCategory } =
		useExpenseMutations();
	const { resolvedTheme } = useTheme();

	const isEditing = Boolean(category);

	const emojiPickerTheme =
		resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT;

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { isSubmitting },
	} = useForm<FormValues>({
		defaultValues: {
			name: "",
			color: randomColor(),
			emoji: "🏷️",
		},
	});

	const emojiValue = watch("emoji");

	useEffect(() => {
		if (category) {
			reset({
				name: category.name,
				color: category.color ?? randomColor(),
				emoji: category.emoji ?? "🏷️",
			});
		} else {
			reset({
				name: "",
				color: randomColor(),
				emoji: "🏷️",
			});
		}
	}, [category, reset]);

	const handleEmojiClick = useCallback(
		(emojiObject: { emoji: string }) => {
			setValue("emoji", emojiObject.emoji);
			setPickerOpen(false);
		},
		[setValue],
	);

	const isPending =
		createCategory.isPending || updateCategory.isPending;

	const onSubmit = async (values: FormValues) => {
		if (isEditing && category) {
			updateCategory.mutate(
				{
					id: category._id,
					payload: {
						name: values.name.trim(),
						emoji: values.emoji || "🏷️",
						color: values.color,
					},
				},
				{
					onSuccess: () => {
						toast.success("Category updated");
						onSuccess?.();
					},
					onError: (error) => {
						toast.error(
							error instanceof Error
								? error.message
								: "Failed to update category",
						);
					},
				},
			);
		} else {
			createCategory.mutate(
				{
					name: values.name.trim(),
					emoji: values.emoji || "🏷️",
					color: values.color,
				},
				{
					onSuccess: () => {
						toast.success("Category created");
						onSuccess?.();
					},
					onError: (error) => {
						toast.error(
							error instanceof Error
								? error.message
								: "Failed to create category",
						);
					},
				},
			);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div className="space-y-1.5">
				<label className="text-sm font-medium text-[var(--color-foreground)]">
					Name
				</label>
				<Input
					{...register("name")}
					placeholder="Food, Transport..."
					autoFocus={!isEditing}
				/>
			</div>

			<div className="space-y-1.5">
				<label className="text-sm font-medium text-[var(--color-foreground)]">
					Emoji
				</label>
				<button
					type="button"
					onClick={() => setPickerOpen((prev) => !prev)}
					className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-lg hover:bg-[var(--color-surface-muted)] transition-colors"
					aria-label="Pick emoji"
				>
					{emojiValue || "🏷️"}
				</button>
				{pickerOpen && (
					<div className="max-h-[40vh] overflow-y-auto rounded-lg">
						<EmojiPicker
							theme={emojiPickerTheme}
							onEmojiClick={handleEmojiClick}
						/>
					</div>
				)}
			</div>

			<div className="space-y-1.5">
				<label className="text-sm font-medium text-[var(--color-foreground)]">
					Color
				</label>
				<div className="flex items-center gap-3">
					<input
						type="color"
						{...register("color")}
						className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-1 cursor-pointer"
					/>
					<div
						className="h-10 w-10 shrink-0 rounded-md border border-[var(--color-border)]"
						style={{ backgroundColor: watch("color") }}
					/>
				</div>
			</div>

			<div className="flex gap-2 pt-2">
				{onCancel && (
					<Button
						type="button"
						variant="outline"
						className="flex-1"
						onClick={onCancel}
					>
						Cancel
					</Button>
				)}
				<Button
					type="submit"
					className={onCancel ? "flex-1" : "w-full"}
					disabled={isPending || isSubmitting}
				>
					{isPending ? (
						<>
							<Spinner className="mr-2" />
							Saving...
						</>
					) : isEditing ? (
						<>
							<FiSave className="mr-1.5 h-4 w-4" />
							Save
						</>
					) : (
						<>
							<FiPlus className="mr-1.5 h-4 w-4" />
							Add
						</>
					)}
				</Button>
			</div>
		</form>
	);
}
