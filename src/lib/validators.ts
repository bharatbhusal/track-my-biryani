import { z } from "zod";

import { HEX_COLOR_REGEX } from "@/lib/validation-constants";

export const signupSchema = z.object({
	name: z.string().min(2).max(255),
	username: z.string().min(6).max(20),
	password: z.string().min(8),
});

export const loginSchema = z.object({
	username: z.string().min(6).max(20),
	password: z.string().min(8),
});

export const categorySchema = z.object({
	name: z.string().min(1).max(50),
	color: z.string().regex(HEX_COLOR_REGEX).optional(),
	emoji: z.string().trim().max(8).optional(),
	bucketId: z.string(),
});

const roundedAmountSchema = z
	.number()
	.positive()
	.transform((value) => Number(value.toFixed(2)));

export const expenseSchema = z.object({
	title: z.string().min(1).max(120),
	amount: roundedAmountSchema,
	categoryId: z.string().min(1),
	bucketId: z.string().optional(),
	notes: z.string().max(400).optional(),
	images: z.array(z.string()).max(5).default([]),
	location: z
		.object({
			latitude: z.number(),
			longitude: z.number(),
			address: z.string().optional(),
		})
		.optional(),
	currency: z.string(),
	paidAt: z.iso.datetime().optional(),
});

export const expenseFiltersSchema = z.object({
	q: z.string().optional(),
	categoryId: z.string().optional(),
	from: z.iso.datetime().optional(),
	to: z.iso.datetime().optional(),
	amountMin: z.coerce.number().min(0).optional(),
	amountMax: z.coerce.number().min(0).optional(),
	sortBy: z
		.enum(["paidAt", "amount", "title"])
		.default("paidAt"),
	order: z.enum(["asc", "desc"]).default("desc"),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const bucketSchema = z.object({
	name: z.string().trim().min(1).max(50),
	icon: z.string().trim().min(1).max(8).optional(),
});

export const inviteSchema = z.object({
	username: z.string().trim().min(1).max(20),
});

const datePresetSchema = z.enum([
	"TODAY",
	"YESTERDAY",
	"THIS_WEEK",
	"LAST_WEEK",
	"THIS_MONTH",
	"LAST_MONTH",
	"LAST_6_MONTHS",
	"THIS_YEAR",
	"LAST_YEAR",
	"CUSTOM",
]);

const bucketPresetSchema = z.enum([
	"PERSONAL",
	"ALL",
	"MULTIPLE",
]);
const categoryPresetSchema = z.enum(["ALL", "MULTIPLE"]);
const ownerPresetSchema = z.enum(["ME", "ALL", "MULTIPLE"]);
const sortDirectionSchema = z.enum(["ASC", "DESC"]);

const paginationSchema = z.object({
	page: z.coerce.number().int().min(1).max(10).default(1),
	pageSize: z.coerce
		.number()
		.int()
		.min(1)
		.max(500)
		.default(50),
});

const sortSchema = z.object({
	field: z.string().default("paidAt"),
	direction: sortDirectionSchema.default("DESC"),
});

const categorySortSchema = z.object({
	field: z.string().default("amount"),
	direction: sortDirectionSchema.default("DESC"),
});

const expenseFilterSchema = z.object({
	bucketPreset: bucketPresetSchema.default("ALL"),
	bucketIds: z.array(z.string()).default([]),
	categoryPreset: categoryPresetSchema.default("ALL"),
	categoryIds: z.array(z.string()).default([]),
	ownerPreset: ownerPresetSchema.default("ALL"),
	ownerIds: z.array(z.string()).default([]),
	datePreset: datePresetSchema.default("THIS_MONTH"),
	customFrom: z.string().optional(),
	customTo: z.string().optional(),
	hasNotes: z.boolean().optional(),
	hasLocation: z.boolean().optional(),
	q: z.string().trim().max(120).optional(),
});

const categoryFilterSchema = z.object({
	bucketPreset: bucketPresetSchema.default("ALL"),
	bucketIds: z.array(z.string()).default([]),
	ownerPreset: ownerPresetSchema.default("ALL"),
	ownerIds: z.array(z.string()).default([]),
	datePreset: datePresetSchema.default("THIS_MONTH"),
	customFrom: z.string().optional(),
	customTo: z.string().optional(),
	q: z.string().trim().max(120).optional(),
});

const auditFilterSchema = z.object({
	bucketPreset: bucketPresetSchema.default("ALL"),
	bucketIds: z.array(z.string()).default([]),
	ownerPreset: ownerPresetSchema.default("ALL"),
	ownerIds: z.array(z.string()).default([]),
	datePreset: datePresetSchema.default("THIS_MONTH"),
	customFrom: z.string().optional(),
	customTo: z.string().optional(),
});

const auditSortSchema = z.object({
	field: z
		.enum(["timestamp", "action", "entity"])
		.default("timestamp"),
	direction: sortDirectionSchema.default("DESC"),
});

const bucketFilterSchema = z.object({
	datePreset: datePresetSchema.default("THIS_MONTH"),
	customFrom: z.string().optional(),
	customTo: z.string().optional(),
	ownerPreset: ownerPresetSchema.default("ALL"),
	ownerIds: z.array(z.string()).default([]),
});

export const expenseSearchSchema = z.object({
	filterCriteria: expenseFilterSchema.optional(),
	sortCriteria: sortSchema.optional(),
	pagination: paginationSchema.optional(),
});

export const categorySearchSchema = z.object({
	filterCriteria: categoryFilterSchema.optional(),
	sortCriteria: sortSchema.optional(),
	pagination: paginationSchema.optional(),
});

export const bucketSearchSchema = z.object({
	filterCriteria: bucketFilterSchema.optional(),
	sortCriteria: sortSchema.optional(),
	pagination: paginationSchema.optional(),
});

export const auditSearchSchema = z.object({
	filterCriteria: auditFilterSchema.optional(),
	sortCriteria: auditSortSchema.optional(),
	pagination: paginationSchema.optional(),
});

export const categoryDistributionSchema = z.object({
	filterCriteria: expenseFilterSchema.optional(),
});

export const chartOverviewSchema = z.object({
	filterCriteria: expenseFilterSchema.optional(),
});

export const distributionSchema = z.object({
	dimension: z.enum(["category", "owner", "bucket"]),
	filterCriteria: expenseFilterSchema.optional(),
});

export const categoryStatsSummarySchema = z.object({
	filterCriteria: categoryFilterSchema.optional(),
	sortCriteria: categorySortSchema.optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
