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
import { fetchCategories } from "@/store/slices/categorySlice";
import { setDateRange } from "@/store/slices/uiSlice";
import { expensesApi } from "@/lib/api/expenses";
import { ExpenseCard } from "@/features/expenses/components/expense-card";
import type { ExpenseItem } from "@/types/expense.types";

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
	const categories = useAppSelector(
		(s) => s.categories.items,
		shallowEqual,
	);
	const expensesLoading = useAppSelector(
		(s) => s.expenses.loading,
	);
	const localRange = useAppSelector((s) => s.ui.dateRange);

	const category = useMemo(
		() =>
			categories.find((c) => c._id === expense?.categoryId) ??
			null,
		[categories, expense?.categoryId],
	);

	useEffect(() => {
		dispatch(fetchExpenseDetail(id));
		dispatch(fetchCategories());
	}, [dispatch, id]);

	useEffect(() => {
		if (!expense?.categoryId) return;
		expensesApi
			.listExpenses({
				categoryId: expense.categoryId,
				limit: 5,
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

			<Card>
				<div className="flex items-center justify-between">
					<ExpenseCard
						expense={expense}
						category={category ?? undefined}
					/>
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

			{recentExpenses.length > 0 && (
				<div className="space-y-2">
					<p className="text-sm font-semibold px-1">
						Recent in {category?.name ?? "Category"}
					</p>
					{recentExpenses.map((e) => (
						<ExpenseCard
							key={e._id}
							expense={e}
							category={category ?? undefined}
						/>
					))}
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
