/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { CategoryForm } from "@/features/categories/components/category-form";
import { useCategoryDetailQuery } from "@/hooks/api/use-expenses-api";
import type { CategoryItem } from "@/types/expense.types";

export function CategoryEditForm({
	id,
	initialCategory,
}: {
	id: string;
	initialCategory?: CategoryItem | null;
}) {
	const router = useRouter();
	const [ready, setReady] = useState(false);
	const categoryQuery = useCategoryDetailQuery(
		id,
		initialCategory,
	);

	useEffect(() => {
		if (categoryQuery.data) {
			setReady(true);
		}
	}, [categoryQuery.data]);

	if (!categoryQuery.data && !ready) {
		return (
			<Card>
				<div className="space-y-3">
					<div className="h-5 w-40 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
					<div className="h-10 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
					<div className="h-10 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
				</div>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardTitle className="mb-3">Edit Category</CardTitle>
				<CategoryForm
					category={categoryQuery.data}
					onSuccess={() => router.push(`/categories/${id}`)}
					onCancel={() => router.push(`/categories/${id}`)}
				/>
			</Card>
		</div>
	);
}
