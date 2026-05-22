"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

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

export function CategoryManager() {
	const [name, setName] = useState("");
	const [emoji, setEmoji] = useState("🏷️");
	const [query, setQuery] = useState("");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
		"asc",
	);
	const categoriesQuery = useCategoriesQuery();
	const { createCategory } = useExpenseMutations();
	const debouncedQuery = useDebouncedValue(query, 300);

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

	return (
		<Card>
			<CardTitle className="mb-4">Categories</CardTitle>
			<form
				className="mb-4 flex gap-2"
				onSubmit={(event) => {
					event.preventDefault();
					if (!name.trim()) return;
					createCategory.mutate(
						{ name: name.trim(), emoji: emoji.trim() || "🏷️" },
						{
						onSuccess: () => {
							setName("");
							setEmoji("🏷️");
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
					onChange={(event) => setName(event.target.value)}
					placeholder="Food, Transport..."
				/>
				<Input
					value={emoji}
					onChange={(event) => setEmoji(event.target.value)}
					placeholder="🏷️"
					className="max-w-20"
				/>
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
						"Add"
					)}
				</Button>
			</form>

			<div className="mb-3 grid grid-cols-2 gap-2">
				<Input
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search categories"
				/>
				<Button
					variant="outline"
					onClick={() =>
						setSortOrder((current) =>
							current === "asc" ? "desc" : "asc",
						)
					}
				>
					Sort {sortOrder === "asc" ? "A-Z" : "Z-A"}
				</Button>
			</div>

			<ul className="space-y-2">
				{items.map((category) => (
					<li key={category._id} data-animate="true">
						<CategoryCard category={category} />
					</li>
				))}
			</ul>
		</Card>
	);
}
