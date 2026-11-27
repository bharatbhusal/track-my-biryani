import { AppError } from "@/lib/errors";
import { BUCKET_ERRORS, ERROR_CODES, USER_ERRORS } from "@/constants/error-messages";
import type { ProfileUser } from "@/constants/types/auth.types";
import userRepository from "@/repositories/user.repository";
import googleIdentityRepository from "@/repositories/google-identity.repository";
import { findBucketByUserId } from "@/repositories/bucket.repository";

async function getCurrentUser(userId: string): Promise<ProfileUser> {
  const [user, bucket, identity] = await Promise.all([
    userRepository.findUserByIdIncludingPassword(userId),
    findBucketByUserId(userId),
    googleIdentityRepository.findByUserId(userId),
  ]);
  if (!user) {
    throw new AppError(USER_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }
  if (!bucket) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    bucketId: bucket._id.toString(),
    googleLinked: !!identity,
    ...(identity?.email ? { googleEmail: identity.email } : {}),
    hasPassword: !!user.password,
  };
}

const userService = {
  getCurrentUser,
};

export default userService;
