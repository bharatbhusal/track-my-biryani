import { AppError } from "@/lib/errors";
import { AUTH_ERRORS, ERROR_CODES } from "@/constants/error-messages";
import { comparePassword, hashPassword, signToken } from "@/lib/auth";
import { createUser, findUserByUsername } from "@/repositories/user.repository";
import { createBucket, findBucketByUserId } from "@/repositories/bucket.repository";
import { ensureCategoryInBucket } from "@/repositories/category.repository";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import type { LoginInput, SignupInput } from "@/lib/validators";
import { AuthUser } from "@/constants/types/auth.types";

export async function registerUser(input: SignupInput): Promise<{
  token: string;
  user: AuthUser;
}> {
  const existing = await findUserByUsername(input.username);
  if (existing) {
    throw new AppError(AUTH_ERRORS.USERNAME_IN_USE, 409, ERROR_CODES.EMAIL_EXISTS);
  }

  const password = await hashPassword(input.password);
  const user = await createUser({
    name: input.name,
    username: input.username,
    password,
  });

  const userId = user._id.toString();

  const personalBucket = await createBucket({
    name: "Personal",
    icon: "📁",
    ownerId: userId,
    isPersonal: true,
    members: [
      {
        userId,
        role: "owner",
        status: "accepted",
        joinedAt: new Date(),
      },
    ],
  });
  const bucketId = personalBucket._id.toString();

  for (const cat of DEFAULT_CATEGORIES) {
    await ensureCategoryInBucket(userId, bucketId, cat);
  }

  const token = signToken({
    id: userId,
    name: user.name,
    username: user.username,
    bucketId,
  });

  return {
    token,
    user: {
      id: userId,
      name: user.name,
      username: user.username,
      bucketId,
    },
  };
}

export async function loginUser(input: LoginInput): Promise<{
  token: string;
  user: AuthUser;
}> {
  const user = await findUserByUsername(input.username);
  if (!user?.password) {
    throw new AppError(AUTH_ERRORS.USER_NOT_FOUND, 401, ERROR_CODES.INVALID_CREDENTIALS);
  }

  const isValid = await comparePassword(input.password, user.password);
  if (!isValid) {
    throw new AppError(AUTH_ERRORS.INCORRECT_CREDENTIALS, 401, ERROR_CODES.INVALID_CREDENTIALS);
  }

  const personalBucket = await findBucketByUserId(user._id.toString());

  const token = signToken({
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    bucketId: personalBucket._id.toString(),
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      bucketId: personalBucket._id.toString(),
    },
  };
}
