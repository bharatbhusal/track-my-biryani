"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import {
	FiCopy,
	FiEdit2,
	FiShare2,
	FiTrash2,
} from "react-icons/fi";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
	useCategoriesQuery,
	useExpenseDetailQuery,
	useExpenseMutations,
	useExpensesQuery,
} from "@/hooks/api/use-expenses-api";
import { getPresetDateRange } from "@/lib/datetime";
import { formatCurrency, formatDate } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";

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
	const allExpensesQuery = useExpensesQuery({
		page: 1,
		limit: 500,
		sortBy: "dateTime",
		order: "desc",
	});
	const { deleteExpense, createExpense } =
		useExpenseMutations();

	const expense = expenseQuery.data;

	const metrics = useMemo(() => {
		if (!expense) {
			return null;
		}

		const items = allExpensesQuery.data?.items ?? [];
		const amount = expense.amount;

		const weekRange = getPresetDateRange("this_week");
		const monthRange = getPresetDateRange("this_month");
		const yearRange = getPresetDateRange("this_year");

		const inRangeTotal = (from: Date, to: Date) =>
			items
				.filter((item) => {
					const date = new Date(item.dateTime);
					return date >= from && date <= to;
				})
				.reduce((sum, item) => sum + item.amount, 0);

		const categoryItems = items.filter(
			(item) => item.categoryId === expense.categoryId,
		);
		const categoryTotal = categoryItems.reduce(
			(sum, item) => sum + item.amount,
			0,
		);
		const percentile =
			categoryTotal > 0 ? (amount / categoryTotal) * 100 : 0;

		return {
			weekContribution: inRangeTotal(
				weekRange.from,
				weekRange.to,
			),
			monthContribution: inRangeTotal(
				monthRange.from,
				monthRange.to,
			),
			yearContribution: inRangeTotal(
				yearRange.from,
				yearRange.to,
			),
			categoryPercentile: percentile,
			similarAverage:
				categoryItems.length > 0
					? categoryItems.reduce(
							(sum, item) => sum + item.amount,
							0,
						) / categoryItems.length
					: amount,
		};
	}, [allExpensesQuery.data?.items, expense]);

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
							variant="outline"
							className="h-9 w-9 p-0"
							aria-label="Duplicate expense"
							onClick={async () => {
								try {
									await createExpense.mutateAsync({
										title: `${expense.title} copy`,
										amount: expense.amount,
										categoryId: expense.categoryId,
										currency: expense.currency,
										dateTime: new Date().toISOString(),
										images: expense.images,
										notes: expense.notes,
										paymentMethod: expense.paymentMethod,
										tags: expense.tags,
										location: expense.location,
									});
									toast.success("Expense duplicated");
								} catch (error) {
									toast.error(
										error instanceof Error
											? error.message
											: "Duplicate failed",
									);
								}
							}}
						>
							<FiCopy />
						</Button>
						<Button
							variant="outline"
							className="h-9 w-9 p-0"
							aria-label="Share expense"
							onClick={async () => {
								const text = `${expense.title} ${formatCurrency(expense.amount, expense.currency || currency, locale)} at ${formatDate(expense.dateTime, locale, timezone)}`;
								try {
									await navigator.clipboard.writeText(text);
									toast.success("Copied to clipboard");
								} catch {
									toast.info(text);
								}
							}}
						>
							<FiShare2 />
						</Button>
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
					<CardTitle className="mb-3">Receipts</CardTitle>
					<div className="flex snap-x gap-3 overflow-x-auto pb-2">
						{expense.images.map((publicId) => (
							<div
								key={publicId}
								className="min-w-[220px] snap-center overflow-hidden rounded-lg border border-[var(--color-border)]"
							>
								<div className="relative h-40 w-full">
									<Image
										src={`https://res.cloudinary.com/dummy/image/upload/${publicId}`}
										alt="Receipt"
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
						<a
							className="text-sm text-emerald-600 underline"
							href={`https://maps.google.com/?q=${expense.location.latitude},${expense.location.longitude}`}
							target="_blank"
							rel="noreferrer"
						>
							Open in Google Maps
						</a>
					</Card>
				)}

			{metrics && (
				<Card>
					<CardTitle className="mb-3">Insights</CardTitle>
					<ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
						<li>
							Contribution this week:{" "}
							{formatCurrency(
								expense.amount,
								expense.currency || currency,
								locale,
							)}{" "}
							/{" "}
							{formatCurrency(
								metrics.weekContribution,
								expense.currency || currency,
								locale,
							)}
						</li>
						<li>
							Contribution this month:{" "}
							{formatCurrency(
								expense.amount,
								expense.currency || currency,
								locale,
							)}{" "}
							/{" "}
							{formatCurrency(
								metrics.monthContribution,
								expense.currency || currency,
								locale,
							)}
						</li>
						<li>
							Contribution this year:{" "}
							{formatCurrency(
								expense.amount,
								expense.currency || currency,
								locale,
							)}{" "}
							/{" "}
							{formatCurrency(
								metrics.yearContribution,
								expense.currency || currency,
								locale,
							)}
						</li>
						<li>
							Category percentile:{" "}
							{metrics.categoryPercentile.toFixed(1)}%
						</li>
						<li>
							Similar expense average:{" "}
							{formatCurrency(
								metrics.similarAverage,
								expense.currency || currency,
								locale,
							)}
						</li>
					</ul>
				</Card>
			)}
		</div>
	);
}
