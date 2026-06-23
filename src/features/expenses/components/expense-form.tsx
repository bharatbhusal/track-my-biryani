/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
	FiArrowLeft,
	FiSave,
	FiPlus,
} from "react-icons/fi";
import { toast } from "sonner";
import { z } from "zod";

import { GlimpsesUpload } from "@/components/uploads/glimpses-upload";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
	useCategoriesQuery,
	useExpenseDetailQuery,
	useExpenseMutations,
} from "@/hooks/api/use-expenses-api";
import {
	getLocalDateTimeInputValue,
	toUtcIsoString,
} from "@/lib/datetime";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useUIStore } from "@/store/ui-store";
import type {
	ExpenseItem,
	CategoryItem,
} from "@/types/expense.types";

const DRAFT_KEY = "expense-tracker-draft";

const schema = z.object({
	title: z.string().min(1),
	amount: z.number().positive(),
	categoryId: z.string().min(1),
	paidAt: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

type Location = {
	latitude: number;
	longitude: number;
};

type ExpenseFormProps = {
	id?: string;
	initialExpense?: ExpenseItem | null;
	initialCategories?: CategoryItem[];
};

function loadDraft(): Partial<FormValues> | null {
	try {
		const raw = localStorage.getItem(DRAFT_KEY);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function saveDraft(values: Partial<FormValues>) {
	try {
		localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
	} catch {
		/* quota exceeded — silently ignore */
	}
}

function clearDraft() {
	try {
		localStorage.removeItem(DRAFT_KEY);
	} catch {
		/* noop */
	}
}

export function ExpenseForm({
	id,
	initialExpense,
	initialCategories,
}: ExpenseFormProps) {
	const router = useRouter();
	const currency = useUIStore((state) => state.currency);
	const locale = useUIStore((state) => state.locale);
	const isEditing = Boolean(id);

	const categoriesQuery = useCategoriesQuery(
		initialCategories,
	);
	const expenseQuery = useExpenseDetailQuery(
		id ?? "",
		isEditing ? initialExpense : undefined,
	);
	const { createExpense, updateExpense } =
		useExpenseMutations();
	const { detect, isLoading: isDetectingLocation } =
		useGeolocation();
	const [images, setImages] = useState<string[]>([]);
	const [location, setLocation] = useState<Location>({
		latitude: 0,
		longitude: 0,
	});
	const hasDetected = useRef(false);

	const defaultValues = useCallback(() => {
		if (isEditing)
			return {
				title: "",
				amount: undefined,
				categoryId: "",
				paidAt: "",
			};
		const draft = loadDraft();
		if (draft && draft.title && draft.categoryId) {
			return {
				title: draft.title ?? "",
				amount: draft.amount ?? undefined,
				categoryId: draft.categoryId ?? "",
				paidAt: draft.paidAt ?? getLocalDateTimeInputValue(),
			};
		}
		return {
			title: "",
			amount: undefined,
			categoryId: "",
			paidAt: getLocalDateTimeInputValue(),
		};
	}, [isEditing]);

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: defaultValues(),
	});
	const {
		handleSubmit,
		reset,
		control,
		formState: { isSubmitting },
	} = form;

	const allValues = useWatch({
		control,
	}) as FormValues | undefined;

	useEffect(() => {
		if (!isEditing && allValues?.title) {
			saveDraft(allValues);
		}
	}, [allValues, isEditing]);

	const isPending =
		createExpense.isPending || updateExpense.isPending;

	useEffect(() => {
		if (!isEditing) return;
		const data = expenseQuery.data;
		if (!data) return;

		reset({
			title: data.title,
			amount: data.amount,
			categoryId: data.categoryId,
			paidAt: getLocalDateTimeInputValue(
				new Date(data.paidAt),
			),
		});
		setLocation({
			latitude: data.location?.latitude ?? 0,
			longitude: data.location?.longitude ?? 0,
		});
		Promise.resolve().then(() => {
			setImages(data.images ?? []);
		});
	}, [expenseQuery.data, reset, isEditing]);

	useEffect(() => {
		if (isEditing) return;
		if (hasDetected.current) return;

		hasDetected.current = true;
		detect().then((pos) => {
			if (pos) {
				setLocation({
					latitude: pos.latitude,
					longitude: pos.longitude,
				});
			}
		});
	}, [isEditing, detect]);

	const onSubmit = async (values: FormValues) => {
		try {
			const payload = {
				title: values.title,
				amount: values.amount,
				categoryId: values.categoryId,
				paidAt: toUtcIsoString(values.paidAt),
				currency,
				location,
				images,
			};

			if (isEditing && id) {
				await updateExpense.mutateAsync({ id, payload });
				toast.success("Expense updated");
				router.replace(`/expenses/${id}`);
			} else {
				const newExpense =
					await createExpense.mutateAsync(payload);
				clearDraft();
				toast.success("Expense created");
				router.replace(`/expenses/${newExpense._id}`);
			}
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: isEditing
						? "Update failed"
						: "Failed to create expense",
			);
		}
	};

	if (isEditing && !expenseQuery.data) {
		return (
			<div className="space-y-3">
				<div className="h-5 w-40 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
				<div className="h-10 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
				<div className="h-10 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
			</div>
		);
	}

	const backLink =
		isEditing && id ? `/expenses/${id}` : "/expenses";

	return (
		<div>
			<h3 className="text-base font-semibold tracking-tight mb-4">
				{isEditing ? "Edit Expense" : "New Expense"}
			</h3>
			<Form {...form}>
				<form
					className="space-y-3"
					onSubmit={handleSubmit(onSubmit)}
				>
					<FormField
						control={control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Title</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="Title"
										autoFocus={!isEditing}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
					<div className="grid grid-cols-2 gap-3">
						<FormField
							control={control}
							name="amount"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Amount</FormLabel>
									<FormControl>
										<div className="relative">
											<span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-[var(--color-muted)]">
												{(0)
													.toLocaleString(locale, {
														style: "currency",
														currency,
														minimumFractionDigits: 0,
														maximumFractionDigits: 0,
													})
													.replace(/[\d.,\s]/g, "")
													.trim() || currency}
											</span>
											<Input
												type="number"
												inputMode="decimal"
												step="0.01"
												className="pl-10"
												value={field.value ?? ""}
												onChange={(event) =>
													field.onChange(
														event.target.value
															? Number(event.target.value)
															: undefined,
													)
												}
											/>
										</div>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={control}
							name="categoryId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Category</FormLabel>
									<FormControl>
										<Select
											value={field.value}
											onChange={(e) => field.onChange(e.target.value)}
										>
											<option value="">Select category</option>
											{(categoriesQuery.data ?? []).map((category) => (
												<option key={category._id} value={category._id}>
													{category.name}
												</option>
											))}
										</Select>
									</FormControl>
								</FormItem>
							)}
						/>
					</div>

					<GlimpsesUpload
						value={images}
						onChange={setImages}
						expenseTitle={allValues?.title || "expense"}
					/>

					<FormField
						control={control}
						name="paidAt"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Date & Time</FormLabel>
								<FormControl>
									<Input
										type="datetime-local"
										value={field.value?.slice(0, 16) ?? ""}
										onChange={(e) => field.onChange(e.target.value)}
									/>
								</FormControl>
							</FormItem>
						)}
					/>

					<div className="flex gap-2 flex-wrap">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => router.push(backLink)}
						>
							<FiArrowLeft className="mr-1.5 h-4 w-4" />
							Cancel
						</Button>
						<Button
							type="submit"
							className="flex-1"
							disabled={
								isSubmitting || isPending || isDetectingLocation
							}
						>
							{isPending || isDetectingLocation ? (
								<>
									<Spinner className="mr-2" />
									Saving...
								</>
							) : isEditing ? (
								<>
									<FiSave className="mr-1.5 h-4 w-4" />
									Save changes
								</>
							) : (
								<>
									<FiPlus className="mr-1.5 h-4 w-4" />
									Create expense
								</>
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
