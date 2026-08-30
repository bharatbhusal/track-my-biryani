import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import { AUTH_COOKIE } from "@/lib/constants";
import { env, getJwtSecret } from "@/config/env";
import { AppError } from "@/lib/errors";
import type { JwtPayload } from "@/types/auth.types";

const COOKIE_MAX_AGE_THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "30d",
  });
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch {
    throw new AppError("Invalid or expired token", 401, "UNAUTHORIZED");
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_THIRTY_DAYS,
    path: "/",
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function getAuthPayload(): Promise<JwtPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  return verifyToken(token);
}
