/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Theme } from "emoji-picker-react";
import { toast } from "sonner";
import { FiPlus, FiSave } from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Drawer } from "@/components/ui/drawer";
import { useExpenseMutations } from "@/hooks/api/use-expenses-api";
import type { CategoryItem } from "@/types/expense.types";

const EmojiPicker = dynamic(
	() => import("emoji-picker-react"),
	{
		ssr: false,
	},
);

type Props = {
	open: boolean;
	onClose: () => void;
	category?: CategoryItem | null;
};

export function AddCategoryDrawer({
	open,
	onClose,
	category,
}: Props) {
	const [name, setName] = useState("");
	const [color, setColor] = useState("#10b981");
	const [emoji, setEmoji] = useState("");
	const [pickerOpen, setPickerOpen] = useState(false);
	const { createCategory, updateCategory } =
		useExpenseMutations();
	const { resolvedTheme } = useTheme();

	const isEditing = Boolean(category);

	const emojiPickerTheme =
		resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT;

	useEffect(() => {
		if (open) {
			if (category) {
				setName(category.name);
				setEmoji(category.emoji ?? "🏷️");
				setColor(category.color ?? "#10b981");
			} else {
				setName("");
				setEmoji("");
				setColor("#10b981");
			}
			setPickerOpen(false);
		}
	}, [open, category]);

	const handleEmojiClick = useCallback(
		(emojiObject: { emoji: string }) => {
			setEmoji(emojiObject.emoji);
			setPickerOpen(false);
		},
		[],
	);

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!name.trim()) return;

		if (isEditing && category) {
			updateCategory.mutate(
				{
					id: category._id,
					payload: {
						name: name.trim(),
						emoji: emoji || "🏷️",
						color,
					},
				},
				{
					onSuccess: () => {
						toast.success("Category updated");
						onClose();
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
				{ name: name.trim(), emoji: emoji || "🏷️" },
				{
					onSuccess: () => {
						setName("");
						setEmoji("");
						setPickerOpen(false);
						toast.success("Category created");
						onClose();
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
		<Drawer
			open={open}
			onClose={onClose}
			title={isEditing ? "Edit Category" : "Add Category"}
			description={
				isEditing
					? "Update this spending category"
					: "Create a new spending category"
			}
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-1.5">
					<label className="text-sm font-medium text-[var(--color-foreground)]">
						Name
					</label>
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Food, Transport..."
						autoFocus
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
						{emoji || "🏷️"}
					</button>
					{pickerOpen && (
						<div className="mt-2 max-h-[40vh] overflow-y-auto rounded-lg">
							<EmojiPicker
								theme={emojiPickerTheme}
								onEmojiClick={handleEmojiClick}
							/>
						</div>
					)}
				</div>

				{isEditing && (
					<div className="space-y-1.5">
						<label className="text-sm font-medium text-[var(--color-foreground)]">
							Color
						</label>
						<input
							type="color"
							value={color}
							onChange={(e) => setColor(e.target.value)}
							className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-1 cursor-pointer"
						/>
					</div>
				)}

				<div className="flex gap-2 pt-2">
					<Button
						type="button"
						variant="outline"
						className="flex-1"
						onClick={onClose}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						className="flex-1"
						disabled={
							(isEditing
								? updateCategory.isPending
								: createCategory.isPending) || !name.trim()
						}
					>
						{isEditing ? (
							updateCategory.isPending ? (
								<>
									<Spinner className="mr-2" />
									Saving...
								</>
							) : (
								<>
									<FiSave className="mr-1.5 h-4 w-4" />
									Save
								</>
							)
						) : createCategory.isPending ? (
							<>
								<Spinner className="mr-2" />
								Adding...
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
		</Drawer>
	);
}
