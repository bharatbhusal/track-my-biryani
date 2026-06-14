"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useTheme } from "next-themes";
import { Theme } from "emoji-picker-react";
import { toast } from "sonner";
import { FiPlus } from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Drawer } from "@/components/ui/drawer";
import { useExpenseMutations } from "@/hooks/api/use-expenses-api";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
	ssr: false,
});

type Props = {
	open: boolean;
	onClose: () => void;
};

export function AddCategoryDrawer({ open, onClose }: Props) {
	const [name, setName] = useState("");
	const [emoji, setEmoji] = useState("");
	const [pickerOpen, setPickerOpen] = useState(false);
	const { createCategory } = useExpenseMutations();
	const { resolvedTheme } = useTheme();

	const emojiPickerTheme =
		resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT;

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
	};

	return (
		<Drawer
			open={open}
			onClose={onClose}
			title="Add Category"
			description="Create a new spending category"
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
						disabled={createCategory.isPending || !name.trim()}
					>
						{createCategory.isPending ? (
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
