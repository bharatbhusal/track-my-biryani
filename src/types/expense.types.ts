import type { PaginationMeta } from "@/types/common.types";

export type ExpenseLocation = {
	latitude: number;
	longitude: number;
	address?: string;
};

export type ExpenseItem = {
	_id: string;
	title: string;
	amount: number;
	currency: string;
	paidAt: string;
	categoryId: string;
	categoryColor?: string;
	categoryEmoji?: string;
	notes?: string;
	images: string[];
	location: ExpenseLocation;
	bucketId?: string | null;
	posterName?: string;
	createdAt?: string;
	updatedAt?: string;
};

export type CategoryItem = {
	_id: string;
	name: string;
	color: string;
	emoji?: string;
};

export type ExpensesListPayload = PaginationMeta & {
	items: ExpenseItem[];
};

export type CreateExpensePayload = {
	title: string;
	amount: number;
	categoryId: string;
	images: string[];
	location: ExpenseLocation;
	currency: string;
	paidAt: string;
	notes?: string;
	bucketId?: string | null;
};

export type ExpenseListQuery = {
	page?: number;
	limit?: number;
	q?: string;
	categoryId?: string;
	from?: string;
	to?: string;
	amountMin?: number;
	amountMax?: number;
	sortBy?: "paidAt" | "amount" | "title";
	order?: "asc" | "desc";
	bucketId?: string | null;
};
