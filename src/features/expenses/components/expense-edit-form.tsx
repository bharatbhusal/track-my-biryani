"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { GlimpsesUpload } from "@/components/uploads/glimpses-upload";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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
import { useUIStore } from "@/store/ui-store";

const schema = z.object({
	title: z.string().min(1),
	amount: z.number().positive(),
	categoryId: z.string().min(1),
	dateTime: z.string().min(1),
	address: z.string().optional(),
	notes: z.string().optional(),
	paymentMethod: z.string().optional(),
	tags: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type ExpenseEditFormProps = {
	id: string;
};

export function ExpenseEditForm({
	id,
}: ExpenseEditFormProps) {
	const currency = useUIStore((state) => state.currency);
	const expenseQuery = useExpenseDetailQuery(id);
	const categoriesQuery = useCategoriesQuery();
	const { updateExpense } = useExpenseMutations();
	const [images, setImages] = useState<string[]>([]);

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			title: "",
			amount: undefined,
			categoryId: "",
			dateTime: getLocalDateTimeInputValue(),
			address: "",
			notes: "",
			paymentMethod: "",
			tags: "",
		},
	});
	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { isSubmitting },
	} = form;

	useEffect(() => {
		if (!expenseQuery.data) {
			return;
		}

		reset({
			title: expenseQuery.data.title,
			amount: expenseQuery.data.amount,
			categoryId: expenseQuery.data.categoryId,
			dateTime: getLocalDateTimeInputValue(
				new Date(expenseQuery.data.dateTime),
			),
			address: expenseQuery.data.location?.address ?? "",
			notes: expenseQuery.data.notes ?? "",
			paymentMethod: expenseQuery.data.paymentMethod ?? "",
			tags: (expenseQuery.data.tags ?? []).join(", "),
		});
		Promise.resolve().then(() => {
			setImages(expenseQuery.data.images ?? []);
		});
	}, [expenseQuery.data, reset]);

	const onSubmit = async (values: FormValues) => {
		try {
			await updateExpense.mutateAsync({
				id,
				payload: {
					title: values.title,
					amount: values.amount,
					categoryId: values.categoryId,
					dateTime: toUtcIsoString(values.dateTime),
					currency,
					location: {
						latitude: expenseQuery.data?.location?.latitude ?? 0,
						longitude:
							expenseQuery.data?.location?.longitude ?? 0,
						address: values.address,
					},
					images,
					notes: values.notes,
					paymentMethod: values.paymentMethod,
					tags: values.tags
						?.split(",")
						.map((tag) => tag.trim())
						.filter(Boolean),
				},
			});
			toast.success("Expense updated");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Update failed",
			);
		}
	};

	if (!expenseQuery.data) {
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

	return (
		<Card>
			<CardTitle className="mb-3">Edit Expense</CardTitle>
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
									<Input {...field} placeholder="Title" />
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
										<Input
											type="number"
											step="0.01"
											value={field.value ?? ""}
											onChange={(event) =>
												field.onChange(
													event.target.value
														? Number(event.target.value)
														: undefined,
												)
											}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={control}
							name="dateTime"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Time • Date</FormLabel>
									<FormControl>
										<DateTimePicker
											value={field.value}
											onChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
					</div>
				<Select {...register("categoryId")}>
					<option value="">Select category</option>
					{(categoriesQuery.data ?? []).map((category) => (
						<option key={category._id} value={category._id}>
							{category.name}
						</option>
					))}
				</Select>
				<Input
					{...register("paymentMethod")}
					placeholder="Payment method"
				/>
				<Input
					{...register("tags")}
					placeholder="Tags (comma separated)"
				/>
				<Input {...register("address")} placeholder="Address" />
				<Input {...register("notes")} placeholder="Notes" />
				<GlimpsesUpload
					value={images}
					onChange={setImages}
					expenseTitle={expenseQuery.data.title}
				/>

					<Button
						type="submit"
						className="w-full"
						disabled={isSubmitting || updateExpense.isPending}
					>
						{updateExpense.isPending ? (
							<>
								<Spinner className="mr-2" />
								Saving...
							</>
						) : (
							"Save changes"
						)}
					</Button>
				</form>
			</Form>
		</Card>
	);
}
