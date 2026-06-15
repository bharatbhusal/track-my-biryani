"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	FiEdit2,
	FiTrash2,
	FiArrowLeft,
} from "react-icons/fi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDrawer } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useCategoriesQuery,
	useExpenseDetailQuery,
	useExpenseMutations,
	useExpenseContributionQuery,
} from "@/hooks/api/use-expenses-api";
import {
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import GoogleMap from "@/components/maps/google-map";
import { formatCurrency, formatDate } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import type {
	ExpenseItem,
	CategoryItem,
} from "@/types/expense.types";
import type { ExpenseContribution } from "@/types/analytics.types";

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
	const categoriesQuery = useCategoriesQuery(
		initialCategories,
	);
	const expenseQuery = useExpenseDetailQuery(
		id,
		initialExpense,
	);
	const contributionQuery = useExpenseContributionQuery(
		id,
		initialContribution,
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
			<Card>
				<div className="mb-3 flex items-center justify-between gap-2">
					<CardTitle>{expense.title}</CardTitle>
					<div className="flex gap-1">
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
				</div>

				<div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
					<p>
						<span className="text-[var(--color-muted)]">
							Amount:
						</span>{" "}
						{formatCurrency(
							expense.amount,
							expense.currency || currency,
							locale,
						)}
					</p>
					<p>
						<span className="text-[var(--color-muted)]">
							Category:
						</span>{" "}
						{category?.emoji ?? "🏷️"}{" "}
						{category?.name ?? "Unknown"}
					</p>
					<p>
						<span className="text-[var(--color-muted)]">
							DateTime:
						</span>{" "}
						{formatDate(expense.dateTime, locale, timezone)}
					</p>
				</div>
			</Card>

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

			{isContributionLoading ? (
				<Card>
					<CardTitle className="mb-3">Insights</CardTitle>
					<div className="space-y-4">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="space-y-3">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-2 w-full" />
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-2 w-full" />
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-2 w-full" />
								<Skeleton className="h-4 w-16" />
							</div>
							<div className="space-y-3">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-2 w-full" />
								<Skeleton className="h-4 w-40" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-full" />
							</div>
						</div>
						<Skeleton className="h-48 w-full" />
					</div>
				</Card>
			) : contribution && (
				<Card>
					<CardTitle className="mb-3">Insights</CardTitle>
					<div className="space-y-4">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="text-sm space-y-3">
								{/* Contribution progress bars */}
								{[
									{
										label: "of Week",
										pct: contribution.weekContributionPercent,
										total: contribution.weekTotal,
									},
									{
										label: "of Month",
										pct: contribution.monthContributionPercent,
										total: contribution.monthTotal,
									},
									{
										label: "of Year",
										pct: contribution.yearContributionPercent,
										total: contribution.yearTotal,
									},
								].map((item) => (
									<div key={item.label}>
										<div className="flex justify-between mb-1 text-xs">
											<span className="text-[var(--color-muted)]">
												{item.label}
											</span>
											<span>
												{formatCurrency(
													contribution.amount,
													expense.currency || currency,
													locale,
												)}{" "}
												/{" "}
												{formatCurrency(
													item.total,
													expense.currency || currency,
													locale,
												)}
											</span>
										</div>
										<div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
											<div
												className="h-full rounded-full bg-[var(--chart-1)] transition-all"
												style={{
													width: `${Math.min(item.pct, 100)}%`,
												}}
											/>
										</div>
										<p className="mt-0.5 text-right text-xs text-[var(--color-muted)]">
											{item.pct.toFixed(1)}%
										</p>
									</div>
								))}
							</div>

							{/* Category comparison */}
							<div className="text-sm space-y-3">
								<p className="text-[var(--color-muted)] text-xs uppercase tracking-wide">
									Category Comparison
								</p>
								<div className="space-y-2">
									<div className="flex justify-between">
										<span>Category average</span>
										<span className="font-medium">
											{formatCurrency(
												contribution.categoryAverage,
												expense.currency || currency,
												locale,
											)}
										</span>
									</div>
									<div className="flex justify-between">
										<span>This expense</span>
										<span className="font-medium">
											{formatCurrency(
												expense.amount,
												expense.currency || currency,
												locale,
											)}
										</span>
									</div>
									<div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
										<div
											className="h-full rounded-full bg-[var(--chart-2)] transition-all"
											style={{
												width: `${Math.min(
													contribution.categoryAverage > 0
														? (expense.amount /
																contribution.categoryAverage) *
																100
														: 0,
													100,
												)}%`,
											}}
										/>
									</div>
									<p className="text-xs text-[var(--color-muted)]">
										{contribution.categoryAverage > 0
											? `${
													expense.amount > contribution.categoryAverage
														? `${((expense.amount / contribution.categoryAverage - 1) * 100).toFixed(0)}% above`
														: `${((1 - expense.amount / contribution.categoryAverage) * 100).toFixed(0)}% below`
												} the category average`
											: "No other expenses in this category"}
									</p>
								</div>

								<div className="pt-2 border-t border-[var(--color-border)]">
									<div className="flex justify-between">
										<span>Category total</span>
										<span className="font-medium">
											{formatCurrency(
												contribution.categoryTotal,
												expense.currency || currency,
												locale,
											)}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Category share</span>
										<span className="font-medium">
											{contribution.categoryContributionPercent.toFixed(
												1,
											)}
											%
										</span>
									</div>
									<div className="flex justify-between">
										<span>Transactions in category</span>
										<span className="font-medium">
											{contribution.categoryExpenseCount}
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Category monthly trend mini chart */}
						{contribution.monthlyTrend.length > 0 && (
							<div className="pt-3 border-t border-[var(--color-border)]">
								<p className="text-xs text-[var(--color-muted)] uppercase tracking-wide mb-2">
									Category Monthly Trend (12 months)
								</p>
								<div className="h-48">
									<ResponsiveContainer width="100%" height="100%">
										<AreaChart data={contribution.monthlyTrend}>
											<XAxis
												dataKey="name"
												tick={{
													fill: "var(--color-muted)",
													fontSize: 12,
												}}
											/>
											<YAxis
												tick={{
													fill: "var(--color-muted)",
													fontSize: 12,
												}}
											/>
											<Tooltip
												contentStyle={{
													backgroundColor: "var(--color-surface)",
													border: "1px solid var(--color-border)",
													borderRadius: "0.5rem",
													fontSize: "0.875rem",
												}}
											/>
											<Area
												dataKey="total"
												stroke="var(--chart-1)"
												fill="color-mix(in srgb, var(--chart-1) 20%, transparent)"
												strokeWidth={2}
											/>
										</AreaChart>
									</ResponsiveContainer>
								</div>
							</div>
						)}
					</div>
				</Card>
			)}

			<ConfirmDrawer
				open={deleteOpen}
				title="Delete expense"
				description="This action cannot be undone."
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
