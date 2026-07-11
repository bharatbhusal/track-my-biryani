"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDrawer } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import GoogleMap from "@/components/maps/google-map";
import { formatCurrency, formatDate } from "@/lib/format";
import {
	useAppSelector,
	useAppDispatch,
} from "@/store/hooks";
import { DateRangeBar } from "@/components/charts/date-range-bar";
import { toIsoBounds } from "@/lib/date-range";
import {
	fetchExpenseDetail,
	fetchExpenseContribution,
	deleteExpense,
} from "@/store/slices/expenseSlice";
import { fetchCategories } from "@/store/slices/categorySlice";
import { setDateRange } from "@/store/slices/uiSlice";

type ExpenseDetailViewProps = {
	id: string;
};

export function ExpenseDetailView({
	id,
}: ExpenseDetailViewProps) {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const [deleteOpen, setDeleteOpen] = useState(false);

	const locale = useAppSelector((s) => s.ui.locale);
	const timezone = useAppSelector((s) => s.ui.timezone);
	const currency = useAppSelector((s) => s.ui.currency);
	const dateRange = useAppSelector((s) => s.ui.dateRange);

	const expense = useAppSelector(
		(s) => s.expenses.currentExpense,
	);
	const categories = useAppSelector(
		(s) => s.categories.items,
	);
	const expensesLoading = useAppSelector(
		(s) => s.expenses.loading,
	);

	const rangeBounds = useMemo(
		() => toIsoBounds(dateRange),
		[dateRange],
	);

	useEffect(() => {
		dispatch(fetchExpenseDetail(id));
		dispatch(fetchCategories());
	}, [dispatch, id]);

	useEffect(() => {
		if (rangeBounds.from && rangeBounds.to) {
			dispatch(
				fetchExpenseContribution({
					id,
					from: rangeBounds.from,
					to: rangeBounds.to,
				}),
			);
		}
	}, [dispatch, id, rangeBounds.from, rangeBounds.to]);

	if (expensesLoading && !expense) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-52" />
				<Card>
					<div className="flex justify-between mb-4">
						<Skeleton className="h-6 w-48" />
						<div className="flex gap-2">
							<Skeleton className="h-9 w-9 rounded" />
							<Skeleton className="h-9 w-9 rounded" />
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div className="space-y-2">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-5 w-32" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-5 w-32" />
						</div>
					</div>
				</Card>
				<Card>
					<Skeleton className="h-5 w-24 mb-3" />
					<Skeleton className="h-40 w-full" />
				</Card>
			</div>
		);
	}

	if (!expense) {
		return <Card>Expense not found</Card>;
	}

	return (
		<div className="space-y-4">
			<DateRangeBar
				title={expense.title}
				range={dateRange}
				onRangeChange={(r) => dispatch(setDateRange(r))}
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
					<GoogleMap
						latitude={expense.location.latitude}
						longitude={expense.location.longitude}
						address={expense.location.address}
						height={240}
					/>
				)}

			<ConfirmDrawer
				open={deleteOpen}
				title="Delete expense"
				description="This action cannot be undone."
				isPending={false}
				onCancel={() => setDeleteOpen(false)}
				onConfirm={async () => {
					try {
						await dispatch(deleteExpense(id)).unwrap();
						toast.success("Expense deleted");
						router.replace("/expenses");
					} catch (error) {
						console.error(error);
						toast.error(
							error instanceof Error
								? error.message
								: "Failed to delete expense",
						);
					}
				}}
			/>
		</div>
	);
}
