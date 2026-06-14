"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useCategoryDetailQuery } from "@/hooks/api/use-expenses-api";
import { expensesApi } from "@/lib/api/expenses";

type FormValues = {
	name: string;
	color: string;
	emoji: string;
};

export function CategoryEditForm({ id }: { id: string }) {
	const categoryQuery = useCategoryDetailQuery(id);
	const {
		register,
		handleSubmit,
		reset,
		formState: { isSubmitting },
	} = useForm<FormValues>({
		defaultValues: {
			name: "",
			color: "#10b981",
			emoji: "🏷️",
		},
	});

	useEffect(() => {
		if (!categoryQuery.data) {
			return;
		}

		reset({
			name: categoryQuery.data.name,
			color: categoryQuery.data.color,
			emoji: categoryQuery.data.emoji ?? "🏷️",
		});
	}, [categoryQuery.data, reset]);

	const onSubmit = async (values: FormValues) => {
		try {
			await expensesApi.updateCategory(id, values);
			toast.success("Category updated");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Update failed",
			);
		}
	};

	if (!categoryQuery.data) {
		return <Card>Loading category...</Card>;
	}

	return (
		<div className="space-y-4">
			<Link
				href={`/categories/${id}`}
				className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
			>
				<FiArrowLeft className="h-4 w-4" />
				Back to Category
			</Link>
		<Card>
			<CardTitle className="mb-3">Edit Category</CardTitle>
			<form
				className="space-y-3"
				onSubmit={handleSubmit(onSubmit)}
			>
				<Input
					{...register("name")}
					placeholder="Category name"
				/>
				<Input {...register("emoji")} placeholder="Emoji" />
				<Input type="color" {...register("color")} />
				<Button
					type="submit"
					className="w-full"
					disabled={isSubmitting}
				>
					{isSubmitting ? (
						<>
							<Spinner className="mr-2" />
							Saving...
						</>
					) : (
						<>
							<FiSave className="mr-1.5 h-4 w-4" />
							Save category
						</>
					)}
				</Button>
			</form>
		</Card>
		</div>
	);
}
