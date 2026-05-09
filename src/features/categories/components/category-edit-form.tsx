"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCategoryDetailQuery } from "@/hooks/api/use-expenses-api";
import { expensesApi } from "@/lib/api/expenses";

type FormValues = {
	name: string;
	color: string;
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
		},
	});

	useEffect(() => {
		if (!categoryQuery.data) {
			return;
		}

		reset({
			name: categoryQuery.data.name,
			color: categoryQuery.data.color,
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
				<Input type="color" {...register("color")} />
				<Button
					type="submit"
					className="w-full"
					disabled={isSubmitting}
				>
					Save category
				</Button>
			</form>
		</Card>
	);
}
