"use client";

import Link from "next/link";
import { useState } from "react";
import { FiEdit2, FiExternalLink } from "react-icons/fi";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import {
	useCategoriesQuery,
	useExpenseMutations,
} from "@/hooks/api/use-expenses-api";
import { Input } from "@/components/ui/input";

export function CategoryManager() {
	const [name, setName] = useState("");
	const [query, setQuery] = useState("");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
		"asc",
	);
	const [deleteId, setDeleteId] = useState<string | null>(
		null,
	);
	const categoriesQuery = useCategoriesQuery();
	const { createCategory, deleteCategory } =
		useExpenseMutations();

	const items = (categoriesQuery.data ?? [])
		.filter((item) =>
			item.name.toLowerCase().includes(query.toLowerCase()),
		)
		.sort((a, b) =>
			sortOrder === "asc"
				? a.name.localeCompare(b.name)
				: b.name.localeCompare(a.name),
		);

	return (
		<Card>
			<CardTitle className="mb-4">Categories</CardTitle>
			<form
				className="mb-4 flex gap-2"
				onSubmit={(event) => {
					event.preventDefault();
					if (!name.trim()) return;
					createCategory.mutate(name, {
						onSuccess: () => {
							setName("");
							toast.success("Category created");
						},
						onError: (error) => {
							toast.error(
								error instanceof Error
									? error.message
									: "Failed to create category",
							);
						},
					});
				}}
			>
				<Input
					value={name}
					onChange={(event) => setName(event.target.value)}
					placeholder="Food, Transport..."
				/>
				<Button
					type="submit"
					disabled={createCategory.isPending}
				>
					Add
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
					<li
						key={category._id}
						className="flex items-center justify-between rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800"
					>
						<div className="flex items-center gap-2">
							<span
								className="inline-block h-3 w-3 rounded-full"
								style={{ backgroundColor: category.color }}
							/>
							<span>{category.name}</span>
						</div>
						<div className="flex items-center gap-1">
							<Link href={`/categories/${category._id}`}>
								<Button
									variant="ghost"
									className="h-8 w-8 p-0"
									aria-label="View category details"
								>
									<FiExternalLink />
								</Button>
							</Link>
							<Link href={`/categories/${category._id}/edit`}>
								<Button
									variant="ghost"
									className="h-8 w-8 p-0"
									aria-label="Edit category"
								>
									<FiEdit2 />
								</Button>
							</Link>
							<Button
								variant="ghost"
								className="text-red-600"
								onClick={() => setDeleteId(category._id)}
							>
								Delete
							</Button>
						</div>
					</li>
				))}
			</ul>

			<ConfirmDialog
				open={Boolean(deleteId)}
				title="Delete category"
				description="This action cannot be undone."
				onCancel={() => setDeleteId(null)}
				onConfirm={() => {
					if (deleteId) {
						deleteCategory.mutate(deleteId, {
							onSuccess: () => {
								toast.success("Category deleted");
								setDeleteId(null);
							},
							onError: (error) => {
								toast.error(
									error instanceof Error
										? error.message
										: "Failed to delete category",
								);
							},
						});
					}
				}}
			/>
		</Card>
	);
}
