"use client";

import { BucketSettings } from "@/features/settings/components/bucket-settings";
import { InvitationsSection } from "@/features/settings/components/invitations-section";
import { MigrationCard } from "@/features/settings/components/migration-card";

export function BucketsPage() {
	return (
		<div className="space-y-4">
			<InvitationsSection />
			<BucketSettings />
			<MigrationCard />
		</div>
	);
}
