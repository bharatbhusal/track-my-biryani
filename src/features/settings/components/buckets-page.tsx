"use client";

import { useEffect } from "react";

import {
	FilterBar,
	useScopedOptions,
} from "@/components/filters";
import { BucketSettings } from "@/features/settings/components/bucket-settings";
import { InvitationsSection } from "@/features/settings/components/invitations-section";

import {
	useAppSelector,
	useAppDispatch,
} from "@/store/hooks";
import { fetchAllBuckets } from "@/store/slices/bucketSlice";

export function BucketsPage() {
	const dispatch = useAppDispatch();
	const allBuckets = useAppSelector(
		(s) => s.buckets.allBuckets,
	);

	// ponytail: owners come from bucket members through the shared hook; the
	// "ALL" preset keeps every bucket's members in scope for the user filter.
	const { owners } = useScopedOptions(
		true,
		allBuckets,
		"ALL",
		[],
	);

	useEffect(() => {
		dispatch(fetchAllBuckets());
	}, [dispatch]);

	return (
		<div className="space-y-2">
			<FilterBar
				variant="buckets"
				buckets={allBuckets}
				categories={[]}
				owners={owners}
				sections={{ owners: true }}
			/>
			<BucketSettings />
			<InvitationsSection />
		</div>
	);
}
