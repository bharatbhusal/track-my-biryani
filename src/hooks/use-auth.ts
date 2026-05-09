'use client';

import { useAuthMe } from '@/hooks/api/use-auth-api';

export function useAuth() {
  return useAuthMe();
}
