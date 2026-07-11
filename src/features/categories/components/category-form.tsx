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
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch } from "@/store/hooks";
import {
	createCategory,
	updateCategory,
} from "@/store/slices/categorySlice";
import type { CategoryItem } from "@/types/expense.types";

const EmojiPicker = dynamic(
	() => import("emoji-picker-react"),
	{
		ssr: false,
	},
);

function randomColor(): string {
	const random = Math.floor(Math.random() * 0xffffff);
	return `#${random.toString(16).padStart(6, "0")}`;
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
	const dispatch = useAppDispatch();
	const { resolvedTheme } = useTheme();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isEditing = Boolean(category);

	const emojiPickerTheme =
		resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT;

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
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
		},
		[setValue],
	);

	const onSubmit = async (values: FormValues) => {
		setIsSubmitting(true);
		try {
			if (isEditing && category) {
				await dispatch(
					updateCategory({
						id: category._id,
						payload: {
							name: values.name.trim(),
							emoji: values.emoji || "🏷️",
							color: values.color,
						},
					}),
				).unwrap();
				toast.success("Category updated");
				onSuccess?.();
			} else {
				await dispatch(
					createCategory({
						name: values.name.trim(),
						emoji: values.emoji || "🏷️",
						color: values.color,
					}),
				).unwrap();
				toast.success("Category created");
				onSuccess?.();
			}
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: isEditing
						? "Failed to update category"
						: "Failed to create category",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="space-y-4"
		>
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

			<div className="flex gap-2">
				<div className="space-y-1.5">
					<label className="text-sm font-medium text-[var(--color-foreground)]">
						Emoji
					</label>
					<Popover>
						<PopoverTrigger asChild>
							<button
								type="button"
								className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-lg hover:bg-[var(--color-surface-muted)] transition-colors"
								aria-label="Pick emoji"
							>
								{emojiValue || "🏷️"}
							</button>
						</PopoverTrigger>
						<PopoverContent
							className="w-auto p-0"
							align="start"
						>
							<div className="max-h-[40vh] overflow-y-auto">
								<EmojiPicker
									theme={emojiPickerTheme}
									onEmojiClick={handleEmojiClick}
								/>
							</div>
						</PopoverContent>
					</Popover>
				</div>

				<div className="space-y-1.5">
					<label className="text-sm font-medium text-[var(--color-foreground)]">
						Color
					</label>

					<input
						type="color"
						{...register("color")}
						className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-lg hover:bg-[var(--color-surface-muted)] transition-colors"
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
					disabled={isSubmitting}
				>
					{isSubmitting ? (
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
