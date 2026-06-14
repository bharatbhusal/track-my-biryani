"use client";

import { useMemo, useState } from "react";
import {
	FiPlus,
	FiSearch,
	FiArrowUp,
	FiArrowDown,
	FiTag,
} from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useCategoriesQuery } from "@/hooks/api/use-expenses-api";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { CategoryCard } from "@/features/categories/components/category-card";
import { AddCategoryDrawer } from "@/features/categories/components/add-category-drawer";

export function CategoryManager() {
	const [query, setQuery] = useState("");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [drawerOpen, setDrawerOpen] = useState(false);
	const categoriesQuery = useCategoriesQuery();
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
			<div className="flex items-center justify-between gap-2 mb-4">
				<CardTitle>
					<FiTag className="inline mr-1.5 h-4 w-4" />
					Categories
				</CardTitle>
				<Button onClick={() => setDrawerOpen(true)}>
					<FiPlus className="mr-1.5 h-4 w-4" />
					Add Category
				</Button>
			</div>

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

			<AddCategoryDrawer
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
			/>
		</Card>
	);
}
