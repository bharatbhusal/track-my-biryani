"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTheme } from "next-themes";
import { Theme } from "emoji-picker-react";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useCategoryDetailQuery } from "@/hooks/api/use-expenses-api";
import { expensesApi } from "@/lib/api/expenses";
import type { CategoryItem } from "@/types/expense.types";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
	ssr: false,
});

type FormValues = {
	name: string;
	color: string;
	emoji: string;
};

export function CategoryEditForm({
	id,
	initialCategory,
}: {
	id: string;
	initialCategory?: CategoryItem | null;
}) {
	const categoryQuery = useCategoryDetailQuery(id, initialCategory);
	const [pickerOpen, setPickerOpen] = useState(false);
	const { resolvedTheme } = useTheme();
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
			color: "#10b981",
			emoji: "🏷️",
		},
	});

	const emojiPickerTheme =
		resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT;
	const emojiValue = watch("emoji");

	useEffect(() => {
		if (!categoryQuery.data) {
			return;
		}

		reset({
			name: categoryQuery.data.name,
			color: categoryQuery.data.color,
			emoji: categoryQuery.data.emoji ?? "🏷️",
		});
	}, [categoryQuery.data, reset]);

	const handleEmojiClick = useCallback(
		(emojiObject: { emoji: string }) => {
			setValue("emoji", emojiObject.emoji);
			setPickerOpen(false);
		},
		[setValue],
	);

	const onSubmit = async (values: FormValues) => {
		try {
			await expensesApi.updateCategory(id, values);
			toast.success("Category updated");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Update failed",
			);
		}
	};

	if (!categoryQuery.data) {
		return <Card>Loading category...</Card>;
	}

	return (
		<div className="space-y-4">
			<Link
				href={`/categories/${id}`}
				className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
			>
				<FiArrowLeft className="h-4 w-4" />
				Back to Category
			</Link>
		<Card>
			<CardTitle className="mb-3">Edit Category</CardTitle>
			<form
				className="space-y-3"
				onSubmit={handleSubmit(onSubmit)}
			>
				<Input
					{...register("name")}
					placeholder="Category name"
				/>
				<div>
					<label className="mb-1 block text-sm font-medium text-[var(--color-muted)]">
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
						<div
							className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
							onClick={() => setPickerOpen(false)}
						>
							<div
								onClick={(e) => e.stopPropagation()}
								className="max-h-[75vh] max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-lg"
							>
								<EmojiPicker
									theme={emojiPickerTheme}
									onEmojiClick={handleEmojiClick}
								/>
							</div>
						</div>
					)}
				</div>
				<Input type="color" {...register("color")} />
				<Button
					type="submit"
					className="w-full"
					disabled={isSubmitting}
				>
					{isSubmitting ? (
						<>
							<Spinner className="mr-2" />
							Saving...
						</>
					) : (
						<>
							<FiSave className="mr-1.5 h-4 w-4" />
							Save category
						</>
					)}
				</Button>
			</form>
		</Card>
		</div>
	);
}
