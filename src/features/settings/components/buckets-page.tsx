"use client";

import { FilterBar } from "@/components/filters";
import { BucketSettings } from "@/features/settings/components/bucket-settings";
import { InvitationsSection } from "@/features/settings/components/invitations-section";
import { useAppSelector } from "@/store/hooks";

export function BucketsPage() {
	const buckets = useAppSelector((s) => s.buckets.buckets);

	return (
		<div className="space-y-4">
			<FilterBar
				variant="buckets"
				buckets={buckets}
				categories={[]}
				owners={[]}
			/>
			<BucketSettings />
			<InvitationsSection />
		</div>
	);
}
