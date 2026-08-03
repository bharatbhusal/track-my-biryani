/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryForm } from "@/features/categories/components/category-form";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchCategoryDetail } from "@/store/slices/categorySlice";

export function CategoryEditForm({ id }: { id: string }) {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const [ready, setReady] = useState(false);

	const category = useAppSelector((s) => s.categories.currentCategory);
	const activeBucketId = useAppSelector(
		(s) => s.ui.activeBucketId,
	);

	useEffect(() => {
		dispatch(
			fetchCategoryDetail({
				id,
				bucketId: activeBucketId ?? undefined,
			}),
		);
	}, [dispatch, id, activeBucketId]);

	useEffect(() => {
		if (category) {
			setReady(true);
		}
	}, [category]);

	if (!category && !ready) {
		return (
			<Card>
				<div className="space-y-4">
					<Skeleton className="h-6 w-40" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-12" />
						<Skeleton className="h-10 w-full" />
					</div>
					<Skeleton className="h-10 w-32" />
				</div>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardTitle className="mb-3">Edit Category</CardTitle>
				<CategoryForm
					category={category}
					onSuccess={() => router.push(`/categories/${id}`)}
					onCancel={() => router.push(`/categories/${id}`)}
				/>
			</Card>
		</div>
	);
}
