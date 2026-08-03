"use client";

import { useEffect } from "react";
import { Select } from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBuckets } from "@/store/slices/bucketSlice";
import { setActiveBucketId } from "@/store/slices/uiSlice";
import type { BucketSummary } from "@/types/bucket.types";

// ponytail: minimal drop-in; Tyrion's settings branch ships the full switcher —
// replace with his once merged.
export function BucketSwitcher({
	onChange,
}: {
	onChange?: (bucketId: string | null) => void;
}) {
	const dispatch = useAppDispatch();
	const buckets = useAppSelector((s) => s.buckets.buckets);
	const activeBucketId = useAppSelector(
		(s) => s.ui.activeBucketId,
	);

	useEffect(() => {
		dispatch(fetchBuckets());
	}, [dispatch]);

	const sharedBuckets = buckets.filter(
		(b): b is BucketSummary & { _id: string } =>
			b._id !== null && b.status === "accepted",
	);

	return (
		<Select
			className="w-full"
			value={activeBucketId ?? ""}
			aria-label="Active bucket"
			onChange={(e) => {
				const bucketId = e.target.value || null;
				onChange?.(bucketId);
				dispatch(setActiveBucketId(bucketId));
			}}
		>
			<option value="">Personal</option>
			{sharedBuckets.map((b) => (
				<option key={b._id} value={b._id}>
					{b.name}
				</option>
			))}
		</Select>
	);
}
