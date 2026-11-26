import "server-only";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  CLOUDINARY_FOLDER_NAME: z.string().min(1, "CLOUDINARY_FOLDER_NAME is required"),
  NEXT_PUBLIC_API_URL: z.string().min(1).default("/api"),
  AUTH_GOOGLE_ID: z.string().default(""),
  AUTH_GOOGLE_SECRET: z.string().default(""),
  AUTH_GOOGLE_REDIRECT_URI: z.string().default("http://localhost:3000/api/auth/callback/google"),
});

type EnvShape = z.infer<typeof envSchema>;

let cachedEnv: EnvShape | null = null;

function validateEnv(): EnvShape {
  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_FOLDER_NAME: process.env.CLOUDINARY_FOLDER_NAME,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_GOOGLE_REDIRECT_URI: process.env.AUTH_GOOGLE_REDIRECT_URI,
  });

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return parsed.data;
}

export function getEnv(): EnvShape {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }

  return cachedEnv;
}

export const env = new Proxy({} as EnvShape, {
  get(_target, prop) {
    return getEnv()[prop as keyof EnvShape];
  },
});

export function getJwtSecret(): string {
  return env.JWT_SECRET;
}
