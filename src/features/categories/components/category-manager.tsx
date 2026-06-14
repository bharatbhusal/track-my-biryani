"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Theme } from "emoji-picker-react";
import { toast } from "sonner";
import {
	FiPlus,
	FiSearch,
	FiArrowUp,
	FiArrowDown,
	FiTag,
} from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
	useCategoriesQuery,
	useExpenseMutations,
} from "@/hooks/api/use-expenses-api";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { CategoryCard } from "@/features/categories/components/category-card";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
	ssr: false,
});

export function CategoryManager() {
	const [name, setName] = useState("");
	const [emoji, setEmoji] = useState("");
	const [query, setQuery] = useState("");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [pickerOpen, setPickerOpen] = useState(false);
	const categoriesQuery = useCategoriesQuery();
	const { createCategory } = useExpenseMutations();
	const { resolvedTheme } = useTheme();
	const debouncedQuery = useDebouncedValue(query, 300);

	const emojiPickerTheme =
		resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT;

	const items = useMemo(
		() =>
			(categoriesQuery.data ?? [])
				.filter((item) =>
					item.name
						.toLowerCase()
						.includes(debouncedQuery.toLowerCase()),
				)
				.sort((a, b) =>
					sortOrder === "asc"
						? a.name.localeCompare(b.name)
						: b.name.localeCompare(a.name),
				),
		[categoriesQuery.data, debouncedQuery, sortOrder],
	);

	const handleEmojiClick = useCallback(
		(emojiObject: { emoji: string }) => {
			setEmoji(emojiObject.emoji);
			setPickerOpen(false);
		},
		[],
	);

	return (
		<Card>
			<div className="flex items-center justify-between gap-2 mb-4">
				<CardTitle>
					<FiTag className="inline mr-1.5 h-4 w-4" />
					Categories
				</CardTitle>
			</div>

			<form
				className="mb-4 flex gap-2"
				onSubmit={(event) => {
					event.preventDefault();
					if (!name.trim()) return;
					createCategory.mutate(
						{ name: name.trim(), emoji: emoji || "🏷️" },
						{
							onSuccess: () => {
								setName("");
								setEmoji("");
								toast.success("Category created");
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
				}}
			>
				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Food, Transport..."
				/>
				<div>
					<button
						type="button"
						onClick={() => setPickerOpen((prev) => !prev)}
						className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-lg hover:bg-[var(--color-surface-muted)] transition-colors"
						aria-label="Pick emoji"
					>
						{emoji || "🏷️"}
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
				<Button
					type="submit"
					disabled={createCategory.isPending}
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
			</form>

			<div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
				<div className="relative">
					<FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search categories"
						className="pl-9"
					/>
				</div>
				<Button
					variant="outline"
					onClick={() =>
						setSortOrder((c) => (c === "asc" ? "desc" : "asc"))
					}
				>
					{sortOrder === "asc" ? (
						<FiArrowUp className="mr-1.5 h-4 w-4" />
					) : (
						<FiArrowDown className="mr-1.5 h-4 w-4" />
					)}
					Sort {sortOrder === "asc" ? "A-Z" : "Z-A"}
				</Button>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
				{items.map((category) => (
					<div key={category._id}>
						<CategoryCard category={category} />
					</div>
				))}
				{items.length === 0 && (
					<p className="col-span-full text-center text-sm text-[var(--color-muted)] py-8">
						No categories found
					</p>
				)}
			</div>
		</Card>
	);
}
