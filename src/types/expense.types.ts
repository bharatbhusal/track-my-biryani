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
	dateTime: string;
	categoryId: string;
	notes?: string;
	paymentMethod?: string;
	tags?: string[];
	images: string[];
	location: ExpenseLocation;
	createdAt?: string;
	updatedAt?: string;
};

export type CategoryItem = {
	_id: string;
	name: string;
	color: string;
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
	dateTime: string;
	notes?: string;
	paymentMethod?: string;
	tags?: string[];
};

export type ExpenseListQuery = {
	page?: number;
	limit?: number;
	q?: string;
	categoryId?: string;
	sortBy?: "dateTime" | "amount" | "title";
	order?: "asc" | "desc";
};
