import type { PaginationMeta } from '@/types/common.types';

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
  images: string[];
  location: ExpenseLocation;
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
};
