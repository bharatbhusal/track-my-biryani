export type ThemeMode = "light" | "dark" | "system";

export type PaginationMeta = {
	total: number;
	page: number;
	totalPages: number;
};

export type UserPreferences = {
	theme: ThemeMode;
	hapticFeedback: boolean;
};
