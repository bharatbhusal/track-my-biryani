"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDrawer } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryCard } from "@/features/categories/components/category-card";
import {
	useCategoriesQuery,
	useExpenseDetailQuery,
	useExpenseMutations,
	useExpenseContributionQuery,
} from "@/hooks/api/use-expenses-api";
import GoogleMap from "@/components/maps/google-map";
import { formatCurrency, formatDate } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import type {
	ExpenseItem,
	CategoryItem,
} from "@/types/expense.types";
import type { ExpenseContribution } from "@/types/analytics.types";
import { DateRangeBar } from "@/components/charts/date-range-bar";
import { usePersistedRange } from "@/hooks/use-persisted-range";
import { toIsoBounds } from "@/lib/date-range";

type ExpenseDetailViewProps = {
	id: string;
	initialExpense?: ExpenseItem | null;
	initialCategories?: CategoryItem[];
	initialContribution?: ExpenseContribution | null;
};

export function ExpenseDetailView({
	id,
	initialExpense,
	initialCategories,
	initialContribution,
}: ExpenseDetailViewProps) {
	const router = useRouter();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const locale = useUIStore((state) => state.locale);
	const timezone = useUIStore((state) => state.timezone);
	const currency = useUIStore((state) => state.currency);
	const [range, setRange] = usePersistedRange();
	const categoriesQuery = useCategoriesQuery(
		initialCategories,
	);
	const expenseQuery = useExpenseDetailQuery(
		id,
		initialExpense,
	);
	const rangeBounds = useMemo(
		() => toIsoBounds(range),
		[range],
	);
	const contributionQuery = useExpenseContributionQuery(
		id,
		initialContribution,
		rangeBounds.from,
		rangeBounds.to,
	);
	const { deleteExpense } = useExpenseMutations();

	const expense = expenseQuery.data;
	const contribution: ExpenseContribution | null =
		contributionQuery.data ?? null;
	const isContributionLoading = contributionQuery.isLoading;

	if (!expense) {
		return <Card>Loading expense...</Card>;
	}

	const category = categoriesQuery.data?.find(
		(item) => item._id === expense.categoryId,
	);

	return (
		<div className="space-y-4">
			<DateRangeBar
				title={expense.title}
				range={range}
				onRangeChange={setRange}
			/>
			<Card>
				<div className="mb-3 flex flex-col gap-2">
					<CardTitle className="flex justify-between">
						<p>{expense.title}</p>
						<div className="flex gap-2">
							<Link href={`/expenses/${id}/edit`}>
								<Button
									variant="outline"
									className="h-9 w-9 p-0"
									aria-label="Edit expense"
								>
									<FiEdit2 />
								</Button>
							</Link>
							<Button
								variant="destructive"
								className="h-9 w-9 p-0"
								aria-label="Delete expense"
								onClick={() => setDeleteOpen(true)}
							>
								<FiTrash2 />
							</Button>
						</div>
					</CardTitle>
				</div>

				<div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
					<p>
						<span className="text-[var(--color-muted)]">
							Amount:
						</span>{" "}
						{formatCurrency(
							expense.amount,
							expense.currency || currency,
						)}
					</p>
					<p>
						<span className="text-[var(--color-muted)]">
							DateTime:
						</span>{" "}
						{formatDate(expense.paidAt, locale, timezone)}
					</p>
					{expense.notes?.trim() && (
						<p className="pt-2 text-sm text-[var(--color-muted)] border-t border-[var(--color-border)]">
							{expense.notes}
						</p>
					)}
				</div>
			</Card>

			{isContributionLoading ? (
				<Card>
					<div className="space-y-4">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="space-y-3">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-2 w-full" />
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-2 w-full" />
								<Skeleton className="h-4 w-16" />
							</div>
						</div>
					</div>
				</Card>
			) : (
				contribution &&
				category && (
					<CategoryCard
						category={category}
						amount={contribution.categoryAverage}
						count={contribution.categoryExpenseCount}
						totalSpend={contribution.categoryTotal}
					/>
				)
			)}
			{expense.images.length > 0 && (
				<Card>
					<CardTitle className="mb-3">Glimpses</CardTitle>
					<div className="flex snap-x gap-3 overflow-x-auto pb-2">
						{expense.images.map((secureUrl) => (
							<div
								key={secureUrl}
								className="min-w-[220px] snap-center overflow-hidden rounded-lg border border-[var(--color-border)]"
							>
								<div className="relative h-40 w-full">
									<Image
										src={secureUrl}
										alt="Glimpse"
										fill
										sizes="(max-width: 640px) 100vw, 400px"
										className="object-cover"
									/>
								</div>
							</div>
						))}
					</div>
				</Card>
			)}

			{expense.location?.latitude !== 0 &&
				expense.location?.longitude !== 0 && (
					<Card>
						<CardTitle className="mb-2">Map Preview</CardTitle>
						<div className="overflow-hidden rounded border border-[var(--color-border)]">
							<GoogleMap
								latitude={expense.location.latitude}
								longitude={expense.location.longitude}
								address={expense.location.address}
								height={240}
							/>
						</div>
					</Card>
				)}

			<ConfirmDrawer
				open={deleteOpen}
				title="Delete expense"
				description="This action cannot be undone."
				isPending={deleteExpense.isPending}
				onCancel={() => setDeleteOpen(false)}
				onConfirm={() => {
					deleteExpense.mutate(id, {
						onSuccess: () => {
							toast.success("Expense deleted");
							router.replace("/expenses");
						},
						onError: (error) => {
							console.error(error);
							toast.error(
								error instanceof Error
									? error.message
									: "Failed to delete expense",
							);
						},
					});
				}}
			/>
		</div>
	);
}
