"use client";

import { BucketSettings } from "@/features/settings/components/bucket-settings";
import { InvitationsSection } from "@/features/settings/components/invitations-section";
import { MigrationCard } from "@/features/settings/components/migration-card";

export function BucketsPage() {
	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">
					Buckets
				</h1>
				<p className="text-xs text-[var(--color-muted)]">
					Shared expense groups and invitations.
				</p>
			</div>
			<InvitationsSection />
			<BucketSettings />
			<MigrationCard />
		</div>
	);
}
