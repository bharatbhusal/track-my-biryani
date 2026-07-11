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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
	getLocalDateTimeInputValue,
	toUtcIsoString,
} from "@/lib/datetime";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
	fetchCategories,
} from "@/store/slices/categorySlice";
import {
	fetchExpenseDetail,
	createExpense,
	updateExpense,
} from "@/store/slices/expenseSlice";
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

export function ExpenseForm({ id }: ExpenseFormProps) {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const currency = useAppSelector((s) => s.ui.currency);
	const locale = useAppSelector((s) => s.ui.locale);
	const isEditing = Boolean(id);

	const categories = useAppSelector((s) => s.categories.items);
	const currentExpense = useAppSelector((s) => s.expenses.currentExpense);
	const expensesLoading = useAppSelector((s) => s.expenses.loading);

	const { detect, isLoading: isDetectingLocation } =
		useGeolocation();
	const [images, setImages] = useState<string[]>([]);
	const [location, setLocation] = useState<Location>({
		latitude: 0,
		longitude: 0,
	});
	const hasDetected = useRef(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		dispatch(fetchCategories());
	}, [dispatch]);

	useEffect(() => {
		if (isEditing && id) {
			dispatch(fetchExpenseDetail(id));
		}
	}, [dispatch, isEditing, id]);

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
	} = form;

	const allValues = useWatch({
		control,
	}) as FormValues | undefined;

	useEffect(() => {
		if (!isEditing && allValues?.title) {
			saveDraft(allValues);
		}
	}, [allValues, isEditing]);

	useEffect(() => {
		if (!isEditing) return;
		if (!currentExpense) return;

		reset({
			title: currentExpense.title,
			amount: currentExpense.amount,
			categoryId: currentExpense.categoryId,
			paidAt: getLocalDateTimeInputValue(
				new Date(currentExpense.paidAt),
			),
		});
		setLocation({
			latitude: currentExpense.location?.latitude ?? 0,
			longitude: currentExpense.location?.longitude ?? 0,
		});
		Promise.resolve().then(() => {
			setImages(currentExpense.images ?? []);
		});
	}, [currentExpense, reset, isEditing]);

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
		setIsSubmitting(true);
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
				await dispatch(updateExpense({ id, payload })).unwrap();
				toast.success("Expense updated");
				router.replace(`/expenses/${id}`);
			} else {
				const newExpense = await dispatch(createExpense(payload)).unwrap();
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
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isEditing && expensesLoading && !currentExpense) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-6 w-40" />
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-10 w-full" />
					</div>
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-10 w-full" />
				</div>
				<Skeleton className="h-10 w-32" />
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
											{categories.map((category) => (
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
								isSubmitting || isDetectingLocation
							}
						>
							{isSubmitting || isDetectingLocation ? (
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
