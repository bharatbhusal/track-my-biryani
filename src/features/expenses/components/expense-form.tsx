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
	FiMapPin,
	FiCompass,
} from "react-icons/fi";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
	getLocalDateTimeInputValue,
	toUtcIsoString,
	formatShortDateTime,
} from "@/lib/datetime";
import { useGeolocation } from "@/hooks/use-geolocation";
import {
	useAppSelector,
	useAppDispatch,
} from "@/store/hooks";
import { fetchCategories } from "@/store/slices/categorySlice";
import {
	fetchExpenseDetail,
	createExpense,
	updateExpense,
} from "@/store/slices/expenseSlice";
import { setDraftExpense, clearDraftExpense } from "@/store/slices/uiSlice";
import type { CreateExpensePayload } from "@/types/expense.types";

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

export function ExpenseForm({ id }: ExpenseFormProps) {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const currency = useAppSelector((s) => s.ui.currency);
	const locale = useAppSelector((s) => s.ui.locale);
	const isEditing = Boolean(id);

	const categories = useAppSelector((s) => s.categories.items);
	const currentExpense = useAppSelector((s) => s.expenses.currentExpense);
	const expensesLoading = useAppSelector((s) => s.expenses.loading);
	const draftExpense = useAppSelector((s) => s.ui.draftExpense);
	const locationPermission = useAppSelector((s) => s.ui.locationPermission);

	const { getCurrentLocation, requestPermission, isLoading: isDetectingLocation } =
		useGeolocation();
	const [location, setLocation] = useState<Location>({
		latitude: 0,
		longitude: 0,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isRequestingPermission, setIsRequestingPermission] = useState(false);
	const dateInputRef = useRef<HTMLInputElement>(null);

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
		if (draftExpense && draftExpense.title && draftExpense.categoryId) {
			return {
				title: draftExpense.title ?? "",
				amount: draftExpense.amount ?? undefined,
				categoryId: draftExpense.categoryId ?? "",
				paidAt: draftExpense.paidAt ?? getLocalDateTimeInputValue(),
			};
		}
		return {
			title: "",
			amount: undefined,
			categoryId: "",
			paidAt: getLocalDateTimeInputValue(),
		};
	}, [isEditing, draftExpense]);

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: defaultValues(),
	});
	const { handleSubmit, reset, control, setValue } = form;

	const allValues = useWatch({
		control,
	}) as FormValues | undefined;

	useEffect(() => {
		if (!isEditing && allValues?.title) {
			dispatch(setDraftExpense(allValues));
		}
	}, [allValues, isEditing, dispatch]);

	useEffect(() => {
		if (!isEditing) return;
		if (!currentExpense) return;

		reset({
			title: currentExpense.title,
			amount: currentExpense.amount,
			categoryId: currentExpense.categoryId,
			paidAt: getLocalDateTimeInputValue(new Date(currentExpense.paidAt)),
		});
		setLocation({
			latitude: currentExpense.location?.latitude ?? 0,
			longitude: currentExpense.location?.longitude ?? 0,
		});
	}, [currentExpense, reset, isEditing]);

	useEffect(() => {
		if (isEditing) return;
		getCurrentLocation().then((pos) => {
			if (pos) {
				setLocation({
					latitude: pos.latitude,
					longitude: pos.longitude,
				});
			}
		});
	}, [isEditing, getCurrentLocation]);

	const handleRequestPermission = async () => {
		setIsRequestingPermission(true);
		const pos = await requestPermission();
		if (pos) {
			setLocation({
				latitude: pos.latitude,
				longitude: pos.longitude,
			});
		}
		setIsRequestingPermission(false);
	};

	const onSubmit = async (values: FormValues) => {
		setIsSubmitting(true);
		try {
			const shouldIncludeLocation =
				locationPermission === "granted" && (location.latitude || location.longitude);

			const payload: CreateExpensePayload = {
				title: values.title,
				amount: values.amount,
				categoryId: values.categoryId,
				paidAt: toUtcIsoString(values.paidAt),
				currency,
				images: [],
				location: shouldIncludeLocation
					? { latitude: location.latitude, longitude: location.longitude }
					: { latitude: 0, longitude: 0 },
			};

			if (isEditing && id) {
				await dispatch(updateExpense({ id, payload })).unwrap();
				toast.success("Expense updated");
				router.replace(`/expenses/${id}`);
			} else {
				const newExpense = await dispatch(createExpense(payload)).unwrap();
				dispatch(clearDraftExpense());
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
			<div className="h-full flex flex-col">
				<div className="flex flex-col items-center gap-6 px-4 pt-8">
					<Skeleton className="h-14 w-full max-w-xs" />
					<Skeleton className="h-10 w-full max-w-xs" />
				</div>
				<div className="space-y-3 px-4 pb-4">
					<div className="grid grid-cols-2 gap-3">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="flex gap-2">
						<Skeleton className="h-12 flex-1" />
						<Skeleton className="h-12 flex-1" />
					</div>
				</div>
			</div>
		);
	}

	const backLink = isEditing && id ? `/expenses/${id}` : "/expenses";

	const displayDate = allValues?.paidAt
		? formatShortDateTime(allValues.paidAt)
		: "";

	return (
		<div className="h-full flex flex-col">
			<Form {...form}>
				<form
					className="h-full flex flex-col justify-between"
					onSubmit={handleSubmit(onSubmit)}
				>
					<div className="flex flex-col items-center gap-6 px-4 pt-8">
						<FormField
							control={control}
							name="amount"
							render={({ field }) => (
								<FormItem className="w-full max-w-xs">
									<FormControl>
										<div className="relative">
											<span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-2xl text-[var(--color-muted)]">
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
												placeholder="0"
												className="h-14 pl-10 text-center text-2xl font-semibold tracking-tight"
												value={field.value ?? ""}
												autoFocus
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
							name="title"
							render={({ field }) => (
								<FormItem className="w-full max-w-xs">
									<FormControl>
										<Input
											{...field}
											placeholder="What was this for?"
											className="text-center text-base"
										/>
									</FormControl>
								</FormItem>
							)}
						/>
					</div>

					<div className="space-y-3 px-4 pb-4">
						<div className="grid grid-cols-2 gap-3">
							<FormField
								control={control}
								name="paidAt"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<>
												<input
													type="datetime-local"
													ref={dateInputRef}
													hidden
													tabIndex={-1}
													aria-hidden="true"
													value={field.value?.slice(0, 16) ?? ""}
													onChange={(e) => {
														field.onChange(e.target.value);
														setValue("paidAt", e.target.value, {
															shouldValidate: true,
														});
													}}
												/>
												<button
													type="button"
													className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-left text-sm text-[var(--color-text)] outline-none transition-all duration-200 hover:border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
													onClick={() =>
														dateInputRef.current?.showPicker()
													}
												>
													{displayDate || "Pick date & time"}
												</button>
											</>
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={control}
								name="categoryId"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<Select
												value={field.value}
												onChange={(e) =>
													field.onChange(e.target.value)
												}
											>
												<option value="">Category</option>
												{categories.map((category) => (
													<option
														key={category._id}
														value={category._id}
													>
														{category.name}
													</option>
												))}
											</Select>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						{(locationPermission !== "granted" || isRequestingPermission) && (
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									className="flex-1 flex items-center justify-center gap-2"
									onClick={handleRequestPermission}
									disabled={isRequestingPermission || isDetectingLocation}
								>
									{locationPermission === "prompt" ? (
										<FiCompass className="h-4 w-4" />
									) : (
										<FiMapPin className="h-4 w-4" />
									)}
									{isRequestingPermission ? (
										<>
											<Spinner className="mr-1" />
											Requesting...
										</>
									) : locationPermission === "prompt" ? (
										"Use location"
									) : (
										"Enable location"
									)}
								</Button>
							</div>
						)}

						{locationPermission === "granted" && (location.latitude || location.longitude) && (
							<div className="flex items-center gap-2 text-sm text-[var(--color-primary)] bg-[var(--color-primary-muted)] px-3 py-2 rounded-xl">
								<FiMapPin className="h-4 w-4" />
								<span>Location will be sent with expense</span>
							</div>
						)}

						<div className="flex gap-2">
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
								disabled={isSubmitting || isDetectingLocation}
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
					</div>
				</form>
			</Form>
		</div>
	);
}