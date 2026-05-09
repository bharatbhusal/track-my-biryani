export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  dashboard: ['dashboard'] as const,
  categories: ['categories'] as const,
  expenses: {
    root: ['expenses'] as const,
    list: (page = 1, limit = 20) => ['expenses', 'list', page, limit] as const,
  },
  logs: {
    list: (page = 1, limit = 25) => ['logs', 'list', page, limit] as const,
  },
};
