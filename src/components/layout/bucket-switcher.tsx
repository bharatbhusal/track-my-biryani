"use client";

import { useEffect, useState } from "react";

import { DropdownList } from "@/components/ui/dropdown-list";
import { AddBucketDialog } from "@/features/settings/components/add-bucket-dialog";
import { cn } from "@/lib/utils";
import {
	useAppDispatch,
	useAppSelector,
} from "@/store/hooks";
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
	const [createOpen, setCreateOpen] = useState(false);

	useEffect(() => {
		dispatch(fetchBuckets());
	}, [dispatch]);

	return (
		<div className={cn("relative inline-block", className)}>
			<DropdownList
				aria-label="Active bucket"
				value={activeBucketId ?? ""}
				onValueChange={(v) =>
					dispatch(
						setActiveBucketId(v === "" ? null : v),
					)
				}
				options={buckets.map((bucket) => ({
					value: bucket._id,
					label: bucket.name,
					icon: bucket.icon ?? "📁",
				}))}
				placeholder={
					loading && buckets.length === 0
						? "Loading…"
						: undefined
				}
				addLabel="Add new bucket"
				onAddNew={() => setCreateOpen(true)}
				disabled={loading && buckets.length === 0}
				className="h-9 w-auto min-w-[130px] max-w-[190px] py-1.5"
			/>
			<AddBucketDialog
				open={createOpen}
				onClose={() => setCreateOpen(false)}
			/>
		</div>
	);
}
