import { z } from "zod";

import { HEX_COLOR_REGEX } from "@/lib/validation-constants";

export const signupSchema = z.object({
	name: z.string().min(2),
	email: z.string().email(),
	password: z.string().min(8),
});

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
});

export const categorySchema = z.object({
	name: z.string().min(1).max(50),
	color: z.string().regex(HEX_COLOR_REGEX).optional(),
});

export const expenseSchema = z.object({
	title: z.string().min(1).max(120),
	amount: z.number().positive(),
	categoryId: z.string().min(1),
	notes: z.string().max(400).optional(),
	paymentMethod: z.string().max(60).optional(),
	tags: z.array(z.string().max(40)).max(10).optional(),
	images: z.array(z.string()).max(5).default([]),
	location: z.object({
		latitude: z.number(),
		longitude: z.number(),
		address: z.string().optional(),
	}),
	currency: z.string(),
	dateTime: z.iso.datetime(),
});

export const expenseFiltersSchema = z.object({
	q: z.string().optional(),
	categoryId: z.string().optional(),
	paymentMethod: z.string().optional(),
	tags: z.string().optional(),
	from: z.iso.datetime().optional(),
	to: z.iso.datetime().optional(),
	amountMin: z.coerce.number().min(0).optional(),
	amountMax: z.coerce.number().min(0).optional(),
	sortBy: z
		.enum(["dateTime", "amount", "title"])
		.default("dateTime"),
	order: z.enum(["asc", "desc"]).default("desc"),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const settingsSchema = z.object({
	locale: z.string().min(2),
	currency: z.string(),
	timezone: z.string().min(3),
	theme: z.enum(["light", "dark", "system"]),
	hapticFeedback: z.boolean(),
	password: z
		.object({
			currentPassword: z.string().min(8),
			newPassword: z.string().min(8),
		})
		.optional(),
});

export const importDataSchema = z.object({
	categories: z.array(
		z.object({
			name: z.string().min(1),
			color: z.string().regex(HEX_COLOR_REGEX),
		}),
	),
	expenses: z.array(
		z.object({
			title: z.string().min(1),
			amount: z.number().positive(),
			categoryName: z.string().min(1),
			images: z.array(z.string()).default([]),
			location: z.object({
				latitude: z.number(),
				longitude: z.number(),
				address: z.string().optional(),
			}),
			currency: z.string(),
			dateTime: z.iso.datetime(),
		}),
	),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type ImportInput = z.infer<typeof importDataSchema>;
