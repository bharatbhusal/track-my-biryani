import { AppError } from "@/lib/errors";
import { ERROR_CODES, USER_ERRORS } from "@/constants/error-messages";
import { findUserById } from "@/repositories/user.repository";
import { findBucketByUserId } from "@/repositories/bucket.repository";

export async function getCurrentUserService(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError(USER_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }
  const bucket = await findBucketByUserId(userId);
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    bucketId: bucket._id.toString(),
  };
}
