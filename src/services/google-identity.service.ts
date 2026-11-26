import { Types } from "mongoose";

import { env } from "@/config/env";
import { signToken } from "@/lib/auth";
import { AUTH_ERRORS, BUCKET_ERRORS, ERROR_CODES, GOOGLE_ERRORS } from "@/constants/error-messages";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/constants/types/audit.types";
import { AuthUser, GoogleLinkStatus } from "@/constants/types/auth.types";
import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from "@/constants/validation";
import { USERNAME_REGEX } from "@/constants/regex";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import {
  buildAuthorizationUrl,
  createFlowMaterial,
  exchangeAuthorizationCode,
} from "@/lib/google-oidc";
import { AppError } from "@/lib/errors";
import { createBucket, findBucketByUserId } from "@/repositories/bucket.repository";
import { ensureCategoryInBucket } from "@/repositories/category.repository";
import googleIdentityRepository from "@/repositories/google-identity.repository";
import oauthFlowRepository from "@/repositories/oauth-flow.repository";
import userRepository from "@/repositories/user.repository";
import { logAuditEvent } from "@/services/audit.service";

const FLOW_TTL_MS = 10 * 60 * 1000;

type LeanUser = {
  _id: Types.ObjectId;
  name: string;
  username: string;
  password?: string;
};

type LeanBucket = { _id: Types.ObjectId };

function assertGoogleConfigured(): void {
  if (!env.AUTH_GOOGLE_ID || !env.AUTH_GOOGLE_SECRET) {
    throw new AppError(GOOGLE_ERRORS.NOT_CONFIGURED, 500);
  }
}

function toAuthUser(user: LeanUser, bucket: LeanBucket): AuthUser {
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    bucketId: bucket._id.toString(),
  };
}

function sanitizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

// Generate a unique legacy username. The Google identity is the proof of control;
// the username only exists because the legacy schema requires it.
async function generateUniqueUsername(claims: { email?: string; name?: string }): Promise<string> {
  const base =
    (claims.email ? sanitizeUsername(claims.email.split("@")[0]) : "") ||
    (claims.name ? sanitizeUsername(claims.name) : "") ||
    "user";
  for (let attempt = 0; attempt < 10; attempt++) {
    const username = attempt === 0 ? base : `${base}${Math.random().toString(36).slice(2, 7)}`;
    const normalized = username.slice(0, USERNAME_MAX_LENGTH);
    if (normalized.length >= USERNAME_MIN_LENGTH && USERNAME_REGEX.test(normalized)) {
      const taken = await userRepository.findUserByUsername(normalized);
      if (!taken) {
        return normalized;
      }
    }
  }
  throw new AppError(AUTH_ERRORS.USERNAME_IN_USE, 409, ERROR_CODES.EMAIL_EXISTS);
}

// Begin Google sign-in (new user). The browser is redirected back to
// AUTH_GOOGLE_REDIRECT_URI with code + state after consent.
async function beginSignIn(params: { redirectPath?: string }): Promise<string> {
  assertGoogleConfigured();
  const material = await createFlowMaterial();
  await oauthFlowRepository.create({
    state: material.state,
    purpose: "login",
    nonce: material.nonce,
    codeVerifier: material.codeVerifier,
    redirectPath: params.redirectPath,
    expiresAt: new Date(Date.now() + FLOW_TTL_MS),
  });
  const url = await buildAuthorizationUrl(material);
  return url.href;
}

// Begin linking a Google identity to an already-authenticated legacy user.
async function beginLink(params: { userId: string; redirectPath?: string }): Promise<string> {
  assertGoogleConfigured();
  const material = await createFlowMaterial();
  await oauthFlowRepository.create({
    state: material.state,
    purpose: "link",
    userId: params.userId,
    nonce: material.nonce,
    codeVerifier: material.codeVerifier,
    redirectPath: params.redirectPath ?? "/auth/link",
    expiresAt: new Date(Date.now() + FLOW_TTL_MS),
  });
  const url = await buildAuthorizationUrl(material);
  return url.href;
}

// Complete sign-up: validate the one-time flow, exchange the code, and mint the
// session token for the canonical user (MongoDB _id) of a new Google account.
async function completeSignUp(params: {
  callbackUrl: string;
  state: string;
  redirectPath?: string;
}): Promise<{ token: string; user: AuthUser; redirectPath: string }> {
  const flow = await oauthFlowRepository.findByState(params.state);
  if (!flow || flow.state !== params.state || flow.purpose !== "login") {
    throw new AppError(GOOGLE_ERRORS.OAUTH_STATE_EXPIRED, 409, ERROR_CODES.OAUTH_STATE_EXPIRED);
  }
  if (flow.expiresAt && flow.expiresAt < new Date()) {
    throw new AppError(GOOGLE_ERRORS.OAUTH_STATE_EXPIRED, 409, ERROR_CODES.OAUTH_STATE_EXPIRED);
  }
  await oauthFlowRepository.deleteByState(params.state);

  const claims = await exchangeAuthorizationCode(params.callbackUrl, flow);

  // Refuse if this Google identity already belongs to another user.
  const existing = await googleIdentityRepository.findByIdentity(claims.sub);
  if (existing) {
    throw new AppError(GOOGLE_ERRORS.ALREADY_LINKED, 409, ERROR_CODES.GOOGLE_ALREADY_LINKED);
  }

  const username = await generateUniqueUsername(claims);
  const name = (claims.name ?? username).trim() || username;
  const user = (await userRepository.createUser({ name, username })) as LeanUser;
  const userId = user._id.toString();

  const personalBucket = await createBucket({
    name: "Personal",
    icon: "📁",
    ownerId: userId,
    isPersonal: true,
    members: [{ userId, role: "owner", status: "accepted", joinedAt: new Date() }],
  });
  const bucketId = personalBucket._id.toString();

  for (const cat of DEFAULT_CATEGORIES) {
    await ensureCategoryInBucket(userId, bucketId, cat);
  }

  await googleIdentityRepository.setUserGoogleIdentity(userId, {
    googleSub: claims.sub,
    email: claims.email,
    emailVerified: claims.emailVerified,
  });

  await logAuditEvent({
    actorId: userId,
    action: AUDIT_ACTIONS.SIGNUP,
    entity: AUDIT_ENTITIES.AUTH,
    note: "Signed up with Google",
  });

  const authUser = toAuthUser(user, personalBucket);
  return { token: signToken(authUser), user: authUser, redirectPath: flow.redirectPath ?? "/" };
}

// Complete link: the session user binds the verified Google sub to their canonical
// user ID. Refuses when the sub is already claimed by another user or the user already
// has a conflicting identity; retries and concurrent callbacks fail safely with 409.
async function completeLink(params: {
  callbackUrl: string;
  state: string;
  sessionUserId: string;
}): Promise<{ linked: true }> {
  const flow = await oauthFlowRepository.findByState(params.state);
  if (
    !flow ||
    flow.state !== params.state ||
    flow.purpose !== "link" ||
    flow.userId?.toString() !== params.sessionUserId
  ) {
    throw new AppError(GOOGLE_ERRORS.OAUTH_STATE_EXPIRED, 409, ERROR_CODES.OAUTH_STATE_EXPIRED);
  }
  if (flow.expiresAt && flow.expiresAt < new Date()) {
    throw new AppError(GOOGLE_ERRORS.OAUTH_STATE_EXPIRED, 409, ERROR_CODES.OAUTH_STATE_EXPIRED);
  }
  await oauthFlowRepository.deleteByState(params.state);

  const claims = await exchangeAuthorizationCode(params.callbackUrl, flow);

  const existing = await googleIdentityRepository.findByIdentity(claims.sub);
  if (existing && existing.userId.toString() !== params.sessionUserId) {
    throw new AppError(GOOGLE_ERRORS.ALREADY_LINKED, 409, ERROR_CODES.GOOGLE_ALREADY_LINKED);
  }

  const user = await userRepository.findUserById(params.sessionUserId);
  if (!user) {
    throw new AppError(AUTH_ERRORS.USER_NOT_FOUND, 404, ERROR_CODES.USER_NOT_FOUND);
  }

  try {
    await googleIdentityRepository.setUserGoogleIdentity(params.sessionUserId, {
      googleSub: claims.sub,
      email: claims.email,
      emailVerified: claims.emailVerified,
    });
    const verify = await googleIdentityRepository.findByUserId(params.sessionUserId);
    if (!verify || verify.googleSub !== claims.sub) {
      throw new AppError(GOOGLE_ERRORS.ALREADY_LINKED, 409, ERROR_CODES.GOOGLE_ALREADY_LINKED);
    }
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new AppError(GOOGLE_ERRORS.ALREADY_LINKED, 409, ERROR_CODES.GOOGLE_ALREADY_LINKED);
    }
    throw error;
  }

  await logAuditEvent({
    actorId: params.sessionUserId,
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.USER,
    entityId: params.sessionUserId,
    note: "Linked Google account",
    metadata: { googleSub: claims.sub },
  });

  return { linked: true };
}

async function unlinkGoogle(userId: string): Promise<{ linked: boolean }> {
  const identity = await googleIdentityRepository.findByUserId(userId);
  if (!identity) {
    return { linked: false };
  }
  const user = await userRepository.findUserById(userId);
  // Refuse when unlinking would leave the user with no way to sign in.
  if (!user?.password) {
    throw new AppError(GOOGLE_ERRORS.NOT_LINKED, 409, ERROR_CODES.NOT_LINKED);
  }
  await googleIdentityRepository.deleteByUserId(userId);
  await logAuditEvent({
    actorId: userId,
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.USER,
    entityId: userId,
    note: "Unlinked Google account",
    metadata: { googleSub: identity.googleSub },
  });
  return { linked: false };
}

async function getStatus(userId: string): Promise<GoogleLinkStatus> {
  const [identity, user] = await Promise.all([
    googleIdentityRepository.findByUserId(userId),
    userRepository.findUserById(userId),
  ]);
  return {
    linked: !!identity,
    ...(identity ? { googleSub: identity.googleSub } : {}),
    emailVerified: identity?.emailVerified ?? false,
    hasPassword: !!user?.password,
  };
}

const googleIdentityService = {
  beginSignIn,
  beginLink,
  completeSignUp,
  completeLink,
  unlinkGoogle,
  getStatus,
};

export default googleIdentityService;
export type { GoogleLinkStatus };
