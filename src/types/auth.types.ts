import type { UserPreferences } from '@/types/common.types';

export type JwtPayload = {
  userId: string;
  email: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  preferences?: UserPreferences;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  name: string;
  email: string;
  password: string;
};
