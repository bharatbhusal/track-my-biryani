"use client";

import { useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { BucketCard } from "@/features/buckets/components/bucket-card";
import {
	useAppDispatch,
	useAppSelector,
} from "@/store/hooks";
import { fetchBuckets } from "@/store/slices/bucketSlice";

export function BucketSettings() {
	const dispatch = useAppDispatch();
	const { buckets, loading } = useAppSelector(
		(s) => s.buckets,
	);
	const sortCriteria = useAppSelector(
		(s) => s.filters.sortCriteria,
	);
	const filterCriteria = useAppSelector(
		(s) => s.filters.filterCriteria,
	);

	useEffect(() => {
		dispatch(fetchBuckets());
	}, [dispatch, sortCriteria, filterCriteria]);

	return (
		<section className="space-y-2">
			{loading && buckets.length === 0 ? (
				<div className="space-y-2">
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
				</div>
			) : (
				buckets.map((bucket) => (
					<BucketCard key={bucket._id} bucket={bucket} />
				))
			)}
		</section>
	);
}
