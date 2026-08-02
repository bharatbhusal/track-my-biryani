"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDrawer } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import GoogleMap from "@/components/maps/google-map";
import {
	useAppSelector,
	useAppDispatch,
} from "@/store/hooks";
import { shallowEqual } from "react-redux";
import { DateRangeBar } from "@/components/charts/date-range-bar";
import type { GlobalDateRange } from "@/lib/date-range";
import {
	fetchExpenseDetail,
	deleteExpense,
} from "@/store/slices/expenseSlice";
import { setDateRange } from "@/store/slices/uiSlice";
import { expensesApi } from "@/lib/api/expenses";
import { ExpenseCard } from "@/features/expenses/components/expense-card";
import type { ExpenseItem } from "@/types/expense.types";
import { ExpenseTable } from "./expense-table";

type ExpenseDetailViewProps = {
	id: string;
};

export function ExpenseDetailView({
	id,
}: ExpenseDetailViewProps) {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [recentExpenses, setRecentExpenses] = useState<
		ExpenseItem[]
	>([]);

	const expense = useAppSelector(
		(s) => s.expenses.currentExpense,
		shallowEqual,
	);

	const expensesLoading = useAppSelector(
		(s) => s.expenses.loading,
	);
	const localRange = useAppSelector((s) => s.ui.dateRange);

	useEffect(() => {
		dispatch(fetchExpenseDetail(id));
	}, [dispatch, id]);

	useEffect(() => {
		if (!expense?.categoryId) return;
		expensesApi
			.listExpenses({
				categoryId: expense.categoryId,
				limit: 20,
			})
			.then((res) => setRecentExpenses(res.items))
			.catch(() => {});
	}, [expense?.categoryId]);

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
					<Skeleton className="h-14 w-full" />
				</Card>
				<Card>
					<Skeleton className="h-5 w-24 mb-3" />
					<Skeleton className="h-48 w-full" />
				</Card>
				<Card>
					<Skeleton className="h-5 w-32 mb-3" />
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-14 w-full" />
						))}
					</div>
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
				range={localRange}
				onRangeChange={(r: GlobalDateRange) =>
					dispatch(setDateRange(r))
				}
			/>

			<ExpenseCard
				expense={expense}
				onEdit={() => router.push(`/expenses/${id}/edit`)}
				onDelete={() => setDeleteOpen(true)}
			/>

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

			{recentExpenses.length > 0 && (
				<div className="space-y-2">
					<p className="text-sm font-semibold px-1">
						Recent in Category
					</p>
					<ExpenseTable items={recentExpenses} />
				</div>
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
						router.replace("/dashboard");
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
