"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiFolder } from "react-icons/fi";
import { toast } from "sonner";

import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDrawer, Drawer } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
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
	updateExpense,
} from "@/store/slices/expenseSlice";
import { fetchBuckets } from "@/store/slices/bucketSlice";
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
	const [moveOpen, setMoveOpen] = useState(false);
	const [moveTarget, setMoveTarget] = useState<string | null>(
		null,
	);
	const [isMoving, setIsMoving] = useState(false);
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
	const activeBucketId = useAppSelector(
		(s) => s.ui.activeBucketId,
	);
	const buckets = useAppSelector((s) => s.buckets.buckets);

	useEffect(() => {
		dispatch(
			fetchExpenseDetail({
				id,
				bucketId: activeBucketId,
			}),
		);
	}, [dispatch, id, activeBucketId]);

	useEffect(() => {
		if (buckets.length === 0) {
			dispatch(fetchBuckets());
		}
	}, [dispatch, buckets.length]);

	useEffect(() => {
		if (!expense?.categoryId) return;
		expensesApi
			.listExpenses({
				categoryId: expense.categoryId,
				limit: 20,
				bucketId: expense.bucketId ?? undefined,
			})
			.then((res) => setRecentExpenses(res.items))
			.catch(() => {});
	}, [expense?.categoryId, expense?.bucketId]);

	const sharedBuckets = buckets.filter(
		(b) => b._id !== null && b.status === "accepted",
	);

	const moveOptions = expense
		? sharedBuckets.filter(
				(b) => b._id !== expense.bucketId,
			)
		: [];

	const handleMove = async () => {
		if (!moveTarget) return;
		setIsMoving(true);
		try {
			await dispatch(
				updateExpense({
					id,
					payload: { bucketId: moveTarget },
				}),
			).unwrap();
			toast.success("Expense moved");
			setMoveOpen(false);
			setMoveTarget(null);
			dispatch(
				fetchExpenseDetail({ id, bucketId: moveTarget }),
			);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to move expense",
			);
		} finally {
			setIsMoving(false);
		}
	};

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

			{expense.posterName && (
				<p className="px-1 text-xs text-[var(--color-muted)]">
					Posted by {expense.posterName}
				</p>
			)}

			{(moveOptions.length > 0 || expense.bucketId) && (
				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={() => {
						setMoveTarget(null);
						setMoveOpen(true);
					}}
				>
					<FiFolder className="mr-1.5 h-4 w-4" />
					Move to bucket
				</Button>
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
					<ExpenseTable
						items={recentExpenses}
					/>
				</div>
			)}

			<Drawer
				open={moveOpen}
				onClose={() => setMoveOpen(false)}
				title="Move to bucket"
				description="Category resolves from the source expense"
			>
				<div className="space-y-3">
					<Select
						value={moveTarget ?? ""}
						aria-label="Destination bucket"
						onChange={(e) =>
							setMoveTarget(e.target.value || null)
						}
					>
						{expense.bucketId && (
							<option value="">Personal</option>
						)}
						{moveOptions.map((b) => (
							<option
								key={b._id as string}
								value={b._id as string}
							>
								{b.name}
							</option>
						))}
					</Select>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => setMoveOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							className="flex-1"
							disabled={!moveTarget || isMoving}
							onClick={handleMove}
						>
							{isMoving ? "Moving..." : "Move"}
						</Button>
					</div>
				</div>
			</Drawer>

			<ConfirmDrawer
				open={deleteOpen}
				title="Delete expense"
				description="This action cannot be undone."
				isPending={false}
				onCancel={() => setDeleteOpen(false)}
				onConfirm={async () => {
					try {
						await dispatch(
							deleteExpense({
								id,
								bucketId: activeBucketId ?? undefined,
							}),
						).unwrap();
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
