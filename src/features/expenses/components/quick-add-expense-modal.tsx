"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { GlimpsesUpload } from "@/components/uploads/glimpses-upload";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
	useCategoriesQuery,
	useExpenseMutations,
} from "@/hooks/api/use-expenses-api";
import {
	getLocalDateTimeInputValue,
	toUtcIsoString,
} from "@/lib/datetime";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useUIStore } from "@/store/ui-store";

const QUICK_ADD_DRAFT_KEY = "expense-quick-add-draft-v1";

const formSchema = z.object({
	title: z.string().min(1),
	amount: z.number().positive(),
	categoryId: z.string().min(1),
	dateTime: z.string().min(1),
	address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type DraftPayload = {
	form: FormValues;
	images: string[];
};

function readDraft(): DraftPayload | null {
	if (typeof window === "undefined") {
		return null;
	}

	const raw = window.localStorage.getItem(
		QUICK_ADD_DRAFT_KEY,
	);
	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw) as DraftPayload;
	} catch {
		return null;
	}
}

export function QuickAddExpenseModal() {
	const quickAddOpen = useUIStore(
		(state) => state.quickAddOpen,
	);
	const setQuickAddOpen = useUIStore(
		(state) => state.setQuickAddOpen,
	);
	const currency = useUIStore((state) => state.currency);
	const { detect, isLoading: isDetectingLocation } =
		useGeolocation();
	const { createExpense } = useExpenseMutations();
	const categoriesQuery = useCategoriesQuery();

	const [images, setImages] = useState<string[]>([]);
	const [dirty, setDirty] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			amount: undefined,
			categoryId: "",
			dateTime: getLocalDateTimeInputValue(),
			address: "",
		},
	});

	// useWatch avoids memoization warnings and provides a stable subscription
	// to form values for draft autosave.
	const watchedValues = useWatch({ control }) as FormValues;

	useEffect(() => {
		const existingDraft = readDraft();
		if (!existingDraft) {
			return;
		}

		reset(existingDraft.form);
		// Defer setState to avoid synchronous setState inside effect
		Promise.resolve().then(() => {
			setImages(existingDraft.images ?? []);
		});
	}, [reset]);

	useEffect(() => {
		if (!quickAddOpen) return;

		// Defer to avoid synchronous setState in effect
		Promise.resolve().then(() => {
			setDirty(true);
		});
	}, [quickAddOpen]);

	useEffect(() => {
		if (!dirty) return;

		const timeout = window.setTimeout(() => {
			const payload: DraftPayload = {
				form: watchedValues,
				images,
			};
			window.localStorage.setItem(
				QUICK_ADD_DRAFT_KEY,
				JSON.stringify(payload),
			);
		}, 400);

		return () => window.clearTimeout(timeout);
	}, [dirty, watchedValues, images]);

	const clearDraft = () => {
		if (typeof window !== "undefined") {
			window.localStorage.removeItem(QUICK_ADD_DRAFT_KEY);
		}
	};

	const closeModal = () => {
		setQuickAddOpen(false);
	};

	const onSubmit = async (values: FormValues) => {
		try {
			const location = await detect();

			await createExpense.mutateAsync({
				title: values.title,
				amount: values.amount,
				categoryId: values.categoryId,
				images,
				dateTime: toUtcIsoString(values.dateTime),
				currency,
				location: {
					latitude: location?.latitude ?? 0,
					longitude: location?.longitude ?? 0,
					address: values.address,
				},
			});

			toast.success("Expense added");
			clearDraft();
			setImages([]);
			reset({
				title: "",
				amount: undefined,
				categoryId: "",
				dateTime: getLocalDateTimeInputValue(),
				address: "",
			});
			setQuickAddOpen(false);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to save expense",
			);
		}
	};

	return (
		<Modal
			open={quickAddOpen}
			onClose={closeModal}
			title="Quick Add Expense"
			description="Drafts are auto-saved while you type."
			className="max-h-[95dvh] overflow-y-auto"
		>
			<form
				className="space-y-3"
				onSubmit={handleSubmit(onSubmit)}
			>
				<label className="block space-y-1 text-sm">
					<span>Title</span>
					<Input {...register("title")} autoFocus />
					{errors.title?.message && (
						<span className="text-xs text-red-600">
							{errors.title.message}
						</span>
					)}
				</label>

				<div className="grid grid-cols-2 gap-3">
					<label className="space-y-1 text-sm">
						<span>Amount</span>
						<Input
							type="number"
							step="0.01"
							{...register("amount", { valueAsNumber: true })}
						/>
						{errors.amount?.message && (
							<span className="text-xs text-red-600">
								{errors.amount.message}
							</span>
						)}
					</label>
					<label className="space-y-1 text-sm">
						<span>Time • Date</span>
						<Input
							type="datetime-local"
							{...register("dateTime")}
						/>
					</label>
				</div>

				<label className="block space-y-1 text-sm">
					<span>Category</span>
					<Select {...register("categoryId")}>
						<option value="">Select</option>
						{(categoriesQuery.data ?? []).map((category) => (
							<option key={category._id} value={category._id}>
								{category.name}
							</option>
						))}
					</Select>
					{errors.categoryId?.message && (
						<span className="text-xs text-red-600">
							{errors.categoryId.message}
						</span>
					)}
				</label>

				<div className="space-y-1 text-sm">
					<span>Glimpses</span>
					<GlimpsesUpload
						value={images}
						onChange={setImages}
						expenseTitle={watchedValues?.title || "expense"}
					/>
				</div>

				<label className="block space-y-1 text-sm">
					<span>Address (optional)</span>
					<Input
						{...register("address")}
						placeholder="Address"
					/>
				</label>

				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						className="w-1/3"
						onClick={closeModal}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						className="w-2/3"
						disabled={
							isSubmitting ||
							createExpense.isPending ||
							isDetectingLocation
						}
					>
						{createExpense.isPending
							? "Saving..."
							: "Add expense"}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
