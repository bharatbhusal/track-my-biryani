"use client";

import { Modal } from "@/components/modals/dialog";
import { CategoryForm } from "@/features/categories/components/category-form";
import type { CategoryItem } from "@/types/expense.types";

type Props = {
	open: boolean;
	onClose: () => void;
	category?: CategoryItem | null;
};

export function AddCategoryDrawer({
	open,
	onClose,
	category,
}: Props) {
	const isEditing = Boolean(category);

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={isEditing ? "Edit Category" : "Add Category"}
			subtitle={
				isEditing ? "Update category" : "New spending category"
			}
			description={
				isEditing
					? "Update this spending category"
					: "Create a new spending category"
			}
		>
			<CategoryForm
				category={category}
				onSuccess={onClose}
				onCancel={onClose}
			/>
		</Modal>
	);
}
