'use client';

import { useQuery } from '@tanstack/react-query';

type MeResponse = {
  success: boolean;
  data?: {
    id: string;
    name: string;
    email: string;
    preferences?: {
      locale: string;
      currency: string;
      theme: 'light' | 'dark' | 'system';
      hapticFeedback: boolean;
    };
  };
};

export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        throw new Error('Unauthorized');
      }
      const payload = (await response.json()) as MeResponse;
      return payload.data;
    },
    retry: false,
  });
}
