"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
	FiArrowLeft,
	FiSave,
	FiPlus,
	FiCrosshair,
} from "react-icons/fi";
import { toast } from "sonner";
import { z } from "zod";

import { GlimpsesUpload } from "@/components/uploads/glimpses-upload";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
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

const LocationPicker = dynamic(
	() =>
		import("@/components/maps/location-picker").then(
			(mod) => mod.LocationPicker,
		),
	{ ssr: false },
);

const schema = z.object({
	title: z.string().min(1),
	amount: z.number().positive(),
	categoryId: z.string().min(1),
	dateTime: z.string().min(1),
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


	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			title: "",
			amount: undefined,
			categoryId: "",
			dateTime: getLocalDateTimeInputValue(),
		},
	});
	const {
		handleSubmit,
		reset,
		control,
		formState: { isSubmitting },
	} = form;

	const watchedTitle = useWatch({
		control,
		name: "title",
	}) as string | undefined;

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
			dateTime: getLocalDateTimeInputValue(
				new Date(data.dateTime),
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

	// Auto-detect location on mount for new expenses
	useEffect(() => {
		if (isEditing) return;
		if (location.latitude !== 0 || location.longitude !== 0)
			return;

		detect().then((pos) => {
			if (pos) {
				setLocation(pos);
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isEditing]);

	const onSubmit = async (values: FormValues) => {
		try {
			const payload = {
				title: values.title,
				amount: values.amount,
				categoryId: values.categoryId,
				dateTime: toUtcIsoString(values.dateTime),
				currency,
				location: {
					latitude: location.latitude,
					longitude: location.longitude,
					address: "",
				},
				images,
			};

			if (isEditing && id) {
				await updateExpense.mutateAsync({ id, payload });
				toast.success("Expense updated");
				router.replace(`/expenses/${id}`);
			} else {
				const newExpense =
					await createExpense.mutateAsync(payload);
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
			<Card>
				<div className="space-y-3">
					<div className="h-5 w-40 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
					<div className="h-10 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
					<div className="h-10 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
				</div>
			</Card>
		);
	}

	const backLink =
		isEditing && id ? `/expenses/${id}` : "/expenses";

	return (
		<div className="space-y-4">
			<Card>
				<CardTitle className="mb-3">
					{isEditing ? "Edit Expense" : "New Expense"}
				</CardTitle>
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
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
												onChange={(e) =>
													field.onChange(e.target.value)
												}
											>
												<option value="">
													Select category
												</option>
												{(categoriesQuery.data ?? []).map(
													(category) => (
														<option
															key={category._id}
															value={category._id}
														>
															{category.name}
														</option>
													),
												)}
											</Select>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<GlimpsesUpload
							value={images}
							onChange={setImages}
							expenseTitle={watchedTitle || "expense"}
						/>

						{/* Location */}
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<FormLabel>Location</FormLabel>
								{location.latitude !== 0 &&
									location.longitude !== 0 && (
										<button
											type="button"
											onClick={async () => {
												const pos = await detect();
												if (pos) setLocation(pos);
											}}
											disabled={isDetectingLocation}
											className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50"
											aria-label="Use current location"
										>
											{isDetectingLocation ? (
												<Spinner className="h-4 w-4" />
											) : (
												<FiCrosshair className="h-4 w-4" />
											)}
										</button>
									)}
							</div>
							{location.latitude !== 0 &&
							location.longitude !== 0 ? (
								<LocationPicker
									location={location}
									onLocationChange={setLocation}
								/>
							) : (
								<p className="text-xs text-[var(--color-muted)]">
									Detecting your location...
								</p>
							)}
						</div>

						{/* Date & Time at the bottom */}
						<FormField
							control={control}
							name="dateTime"
							render={({ field }) => {
								const datePart = field.value
									? field.value.slice(0, 10)
									: "";
								const timePart =
									(field.value &&
										field.value.slice(11, 16)) ||
									"12:00";

								const handleDateChange = (
									e: React.ChangeEvent<HTMLInputElement>,
								) => {
									const newDate = e.target.value;
									field.onChange(
										`${newDate}T${timePart}`,
									);
								};

								const handleTimeChange = (
									e: React.ChangeEvent<HTMLInputElement>,
								) => {
									const newTime = e.target.value;
									field.onChange(
										`${datePart || getLocalDateTimeInputValue().slice(0, 10)}T${newTime}`,
									);
								};

								return (
									<FormItem>
										<FormLabel>Date • Time</FormLabel>
										<FormControl>
											<div className="grid grid-cols-2 gap-2">
												<Input
													type="date"
													value={datePart}
													onChange={handleDateChange}
												/>
												<Input
													type="time"
													value={timePart}
													onChange={handleTimeChange}
												/>
											</div>
										</FormControl>
									</FormItem>
								);
							}}
						/>

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
			</Card>
		</div>
	);
}
