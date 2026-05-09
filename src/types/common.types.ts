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

export type Option<T = string> = {
	label: string;
	value: T;
};
