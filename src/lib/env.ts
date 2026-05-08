export const env = {
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
};

export function getJwtSecret(): string {
  if (!env.JWT_SECRET) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }
  return env.JWT_SECRET;
}
