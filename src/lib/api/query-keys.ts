export const queryKeys = {
	auth: {
		me: ["auth", "me"] as const,
	},
	dashboard: ["dashboard"] as const,
	categories: ["categories"] as const,
	expenses: {
		root: ["expenses"] as const,
		list: (filters: Record<string, unknown>) =>
			["expenses", "list", filters] as const,
		detail: (id: string) =>
			["expenses", "detail", id] as const,
	},
};
