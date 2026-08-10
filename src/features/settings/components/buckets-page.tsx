"use client";

import { useEffect, useMemo } from "react";

import { FilterBar, useScopedOptions } from "@/components/filters";
import { Card } from "@/components/ui/card";
import { BucketSettings } from "@/features/settings/components/bucket-settings";
import { InvitationsSection } from "@/features/settings/components/invitations-section";
import { formatCurrency } from "@/lib/format";
import {
	useAppSelector,
	useAppDispatch,
} from "@/store/hooks";
import { fetchAllBuckets } from "@/store/slices/bucketSlice";

export function BucketsPage() {
	const dispatch = useAppDispatch();
	const buckets = useAppSelector((s) => s.buckets.buckets);
	const allBuckets = useAppSelector(
		(s) => s.buckets.allBuckets,
	);
	const currency = useAppSelector((s) => s.ui.currency);

	// ponytail: owners come from bucket members through the shared hook; the
	// "ALL" preset keeps every bucket's members in scope for the user filter.
	const { owners } = useScopedOptions(true, allBuckets, "ALL", []);

	useEffect(() => {
		dispatch(fetchAllBuckets());
	}, [dispatch]);

	const summaryCells = useMemo<
		Array<[string, string]>
	>(() => {
		const totals = buckets.reduce(
			(acc, b) => {
				acc.spend += b.totalAmount ?? 0;
				acc.expenses += b.expenseCount ?? 0;
				return acc;
			},
			{ spend: 0, expenses: 0 },
		);
		const min = buckets.reduce(
			(m, b) => Math.min(m, b.totalAmount ?? 0),
			Infinity,
		);
		return [
			["Buckets", String(buckets.length)],
			["Total Spend", formatCurrency(totals.spend, currency)],
			["Min", formatCurrency(buckets.length ? min : 0, currency)],
			["Expenses", String(totals.expenses)],
		];
	}, [buckets, currency]);

	return (
		<div className="space-y-2">
			<FilterBar
				variant="buckets"
				buckets={allBuckets}
				categories={[]}
				owners={owners}
				sections={{ owners: true }}
			/>
			<div className="flex flex-wrap gap-2">
				{summaryCells.map(([label, value]) => (
					<Card key={label} className="min-w-[100px] flex-1">
						<p className="truncate text-xs text-[var(--color-muted)]">
							{label}
						</p>
						<p className="truncate font-medium tabular-nums">
							{value}
						</p>
					</Card>
				))}
			</div>
			<BucketSettings />
			<InvitationsSection />
		</div>
	);
}
