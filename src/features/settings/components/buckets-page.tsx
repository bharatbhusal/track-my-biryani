"use client";

import { BucketSettings } from "@/features/settings/components/bucket-settings";
import { InvitationsSection } from "@/features/settings/components/invitations-section";

export function BucketsPage() {
	return (
		<div className="space-y-4">
			<InvitationsSection />
			<BucketSettings />
		</div>
	);
}
