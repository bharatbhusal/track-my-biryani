import { AppError } from "@/lib/errors";
import { findUserById } from "@/repositories/user.repository";
import { findBucketByUserId } from "@/repositories/bucket.repository";

export async function getCurrentUserService(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }
  const bucket = await findBucketByUserId(userId);
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    bucketId: bucket._id.toString(),
  };
}
