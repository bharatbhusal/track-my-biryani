"use client";

import Link from "next/link";
import Image from "next/image";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
	useCategoriesQuery,
	useExpenseDetailQuery,
	useExpenseMutations,
	useExpenseContributionQuery,
} from "@/hooks/api/use-expenses-api";
import { BarChart } from "@/components/charts/bar-chart";
import GoogleMap from "@/components/maps/google-map";
import { formatCurrency, formatDate } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import type { ExpenseContribution } from "@/types/analytics.types";

type ExpenseDetailViewProps = {
	id: string;
};

export function ExpenseDetailView({
	id,
}: ExpenseDetailViewProps) {
	const locale = useUIStore((state) => state.locale);
	const timezone = useUIStore((state) => state.timezone);
	const currency = useUIStore((state) => state.currency);
	const categoriesQuery = useCategoriesQuery();
	const expenseQuery = useExpenseDetailQuery(id);
	const contributionQuery = useExpenseContributionQuery(id);
	const { deleteExpense } = useExpenseMutations();

	const expense = expenseQuery.data;
	const contribution: ExpenseContribution | null =
		contributionQuery.data ?? null;

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
							onClick={async () => {
								try {
									await deleteExpense.mutateAsync(id);
									toast.success("Expense deleted");
								} catch (error) {
									toast.error(
										error instanceof Error
											? error.message
											: "Delete failed",
									);
								}
							}}
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
						{category?.name ?? "Unknown"}
					</p>
					<p>
						<span className="text-[var(--color-muted)]">
							DateTime:
						</span>{" "}
						{formatDate(expense.dateTime, locale, timezone)}
					</p>
					<p>
						<span className="text-[var(--color-muted)]">
							Payment:
						</span>{" "}
						{expense.paymentMethod ?? "Not set"}
					</p>
					<p>
						<span className="text-[var(--color-muted)]">
							Tags:
						</span>{" "}
						{expense.tags?.join(", ") || "None"}
					</p>
					<p>
						<span className="text-[var(--color-muted)]">
							Address:
						</span>{" "}
						{expense.location?.address || "Not available"}
					</p>
					<p className="md:col-span-2">
						<span className="text-[var(--color-muted)]">
							Notes:
						</span>{" "}
						{expense.notes || "No notes"}
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

			{contribution && (
				<Card>
					<CardTitle className="mb-3">Insights</CardTitle>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<div className="text-sm">
							<p>
								Contribution (week):{" "}
								{formatCurrency(
									expense.amount,
									expense.currency || currency,
									locale,
								)}{" "}
								/{" "}
								{formatCurrency(
									contribution.weekTotal,
									expense.currency || currency,
									locale,
								)}
							</p>
							<p>
								Contribution (month):{" "}
								{formatCurrency(
									expense.amount,
									expense.currency || currency,
									locale,
								)}{" "}
								/{" "}
								{formatCurrency(
									contribution.monthTotal,
									expense.currency || currency,
									locale,
								)}
							</p>
							<p>
								Contribution (year):{" "}
								{formatCurrency(
									expense.amount,
									expense.currency || currency,
									locale,
								)}{" "}
								/{" "}
								{formatCurrency(
									contribution.yearTotal,
									expense.currency || currency,
									locale,
								)}
							</p>
							<p>
								Category percentile:{" "}
								{contribution.categoryContributionPercent.toFixed(
									2,
								)}
								%
							</p>
						</div>
						<div>
							<BarChart
								data={[
									{
										name: "Week %",
										total: parseFloat(
											contribution.weekContributionPercent?.toFixed(
												2,
											) || "0",
										),
									},
									{
										name: "Month %",
										total: parseFloat(
											contribution.monthContributionPercent?.toFixed(
												2,
											) || "0",
										),
									},
									{
										name: "Year %",
										total: parseFloat(
											contribution.yearContributionPercent?.toFixed(
												2,
											) || "0",
										),
									},
								]}
								heightClass="h-40"
							/>
						</div>
					</div>
				</Card>
			)}
		</div>
	);
}
