export type CategoryColor = `#${string}`;

export type UserPreferences = {
  locale: string;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  hapticFeedback: boolean;
};

export type ExpenseLocation = {
  latitude: number;
  longitude: number;
  address?: string;
};
