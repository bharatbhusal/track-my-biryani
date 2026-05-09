export type ThemeMode = 'light' | 'dark' | 'system';

export type PaginationMeta = {
  total: number;
  page: number;
  totalPages: number;
};

export type UserPreferences = {
  locale: string;
  currency: string;
  timezone: string;
  theme: ThemeMode;
  hapticFeedback: boolean;
};

export type Option<T = string> = {
  label: string;
  value: T;
};
