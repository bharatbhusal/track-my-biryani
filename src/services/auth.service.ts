import { AppError } from "@/lib/errors";
import { AUTH_ERRORS, BUCKET_ERRORS, ERROR_CODES, USER_ERRORS, VALIDATION_ERRORS } from "@/constants/error-messages";
import { comparePassword, hashPassword, signToken } from "@/lib/auth";
import { loginSchema, signupSchema } from "@/lib/validators";
import userRepository from "@/repositories/user.repository";
import googleIdentityRepository from "@/repositories/google-identity.repository";
import { createBucket, findBucketByUserId } from "@/repositories/bucket.repository";
import { ensureCategoryInBucket } from "@/repositories/category.repository";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { logAuditEvent } from "@/services/audit.service";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/constants/types/audit.types";
import { AuthUser } from "@/constants/types/auth.types";
import { USERNAME_REGEX } from "@/constants/regex";
import {
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
} from "@/constants/validation";

async function registerUser(body: unknown): Promise<{
  token: string;
  user: AuthUser;
}> {
  const input = signupSchema.parse(body);

  const existing = await userRepository.findUserByUsername(input.username);
  if (existing) {
    // ponytail: EMAIL_EXISTS code predates username auth; kept for client compat.
    throw new AppError(AUTH_ERRORS.USERNAME_IN_USE, 409, ERROR_CODES.EMAIL_EXISTS);
  }

  const password = await hashPassword(input.password);
  const user = await userRepository.createUser({
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

  await logAuditEvent({
    actorId: userId,
    action: AUDIT_ACTIONS.SIGNUP,
    entity: AUDIT_ENTITIES.AUTH,
    note: "Signed up",
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

async function loginUser(body: unknown): Promise<{
  token: string;
  user: AuthUser;
}> {
  const input = loginSchema.parse(body);

  const user = await userRepository.findUserByUsername(input.username);
  if (!user?.password) {
    throw new AppError(AUTH_ERRORS.USER_NOT_FOUND, 401, ERROR_CODES.INVALID_CREDENTIALS);
  }

  // Refuse password login when Google is linked — Google sign-in is the only path.
  const identity = await googleIdentityRepository.findByUserId(user._id.toString());
  if (identity) {
    throw new AppError(AUTH_ERRORS.GOOGLE_LINKED, 403, ERROR_CODES.GOOGLE_LINKED);
  }

  const isValid = await comparePassword(input.password, user.password);
  if (!isValid) {
    throw new AppError(AUTH_ERRORS.INCORRECT_CREDENTIALS, 401, ERROR_CODES.INVALID_CREDENTIALS);
  }

  const personalBucket = await findBucketByUserId(user._id.toString());
  if (!personalBucket) {
    throw new AppError(BUCKET_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  const userId = user._id.toString();
  const bucketId = personalBucket._id.toString();

  const token = signToken({
    id: userId,
    name: user.name,
    username: user.username,
    bucketId,
  });

  await logAuditEvent({
    actorId: userId,
    action: AUDIT_ACTIONS.LOGIN,
    entity: AUDIT_ENTITIES.AUTH,
    note: "Logged in",
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

async function logoutUser(actorId: string) {
  await logAuditEvent({
    actorId,
    action: AUDIT_ACTIONS.LOGOUT,
    entity: AUDIT_ENTITIES.AUTH,
    note: "Logged out",
  });
  return { message: "Logged out" };
}

async function updateCredentials(
  sessionUserId: string,
  data: { username?: string; password?: string },
): Promise<{ updated: boolean }> {
  const user = await userRepository.findUserById(sessionUserId);
  if (!user) {
    throw new AppError(USER_ERRORS.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  const updates: Record<string, unknown> = {};

  if (data.username !== undefined) {
    const normalized = data.username.trim().toLowerCase();
    if (
      normalized.length < USERNAME_MIN_LENGTH ||
      normalized.length > USERNAME_MAX_LENGTH ||
      !USERNAME_REGEX.test(normalized)
    ) {
      throw new AppError(
        "Username can only contain lowercase letters, numbers, and underscores",
        400,
        ERROR_CODES.INVALID_INPUT,
      );
    }
    const existing = await userRepository.findUserByUsername(normalized);
    if (existing && existing._id.toString() !== sessionUserId) {
      throw new AppError(AUTH_ERRORS.USERNAME_IN_USE, 409, ERROR_CODES.EMAIL_EXISTS);
    }
    updates.username = normalized;
  }

  if (data.password !== undefined) {
    updates.password = await hashPassword(data.password);
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError(VALIDATION_ERRORS.INVALID_REQUEST, 400, ERROR_CODES.INVALID_INPUT);
  }

  await userRepository.updateUser(sessionUserId, updates);
  return { updated: true };
}

const authService = {
  registerUser,
  loginUser,
  logoutUser,
  updateCredentials,
};

export default authService;
