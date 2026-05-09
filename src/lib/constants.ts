export const AUTH_COOKIE = 'expense_tracker_auth';

export const PROTECTED_ROUTES = ['/dashboard', '/expenses', '/categories', '/logs', '/settings'];

export const DEFAULT_PREFERENCES = {
  locale: 'en-IN',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  theme: 'system',
  hapticFeedback: true,
} as const;
