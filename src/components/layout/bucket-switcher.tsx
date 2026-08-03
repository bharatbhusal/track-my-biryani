"use client";

import { useEffect } from "react";
import { FiFolder } from "react-icons/fi";

import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBuckets } from "@/store/slices/bucketSlice";
import { setActiveBucketId } from "@/store/slices/uiSlice";

export function BucketSwitcher({
	className,
}: {
	className?: string;
}) {
	const dispatch = useAppDispatch();
	const { buckets, loading } = useAppSelector(
		(s) => s.buckets,
	);
	const activeBucketId = useAppSelector(
		(s) => s.ui.activeBucketId,
	);

	useEffect(() => {
		dispatch(fetchBuckets());
	}, [dispatch]);

	return (
		<div className={cn("relative inline-block", className)}>
			<FiFolder
				className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
				aria-hidden="true"
			/>
			<Select
				aria-label="Active bucket"
				value={activeBucketId ?? ""}
				onChange={(e) =>
					dispatch(
						setActiveBucketId(
							e.target.value === "" ? null : e.target.value,
						),
					)
				}
				disabled={loading && buckets.length === 0}
				className="h-9 w-auto min-w-[130px] max-w-[190px] py-1.5 pl-8 pr-2"
			>
				{loading && buckets.length === 0 ? (
					<option value="">Loading…</option>
				) : (
					buckets.map((bucket) => (
						<option
							key={bucket._id ?? "personal"}
							value={bucket._id ?? ""}
						>
							{bucket.name}
						</option>
					))
				)}
			</Select>
		</div>
	);
}
