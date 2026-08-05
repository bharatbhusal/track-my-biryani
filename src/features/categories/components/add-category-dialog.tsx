"use client";

import { Modal } from "@/components/modals/dialog";
import { CategoryForm } from "@/features/categories/components/category-form";

type Props = {
	open: boolean;
	onClose: () => void;
	id?: string;
};

export function AddCategoryDialog({
	open,
	onClose,
	id,
}: Props) {
	const isEditing = Boolean(id);

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
			<CategoryForm id={id} onSuccess={onClose} onCancel={onClose} />
		</Modal>
	);
}
