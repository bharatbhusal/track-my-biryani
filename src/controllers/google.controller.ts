import { NextRequest } from "next/server";

import { AppError } from "@/lib/errors";
import { ERROR_CODES, GOOGLE_ERRORS } from "@/constants/error-messages";
import { getAuthPayload } from "@/lib/auth";
import oauthFlowRepository from "@/repositories/oauth-flow.repository";
import googleIdentityService from "@/services/google-identity.service";
import userService from "@/services/user.service";

function parseRedirectPath(body: { mode?: unknown; redirectPath?: unknown }): string | undefined {
  const value = body?.redirectPath;
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : undefined;
}

async function beginSignIn(body: { mode?: unknown }): Promise<{ url: string }> {
  if ((body?.mode as string) === "link") {
    const auth = await getAuthPayload();
    const url = await googleIdentityService.beginLink({
      userId: auth.id,
      redirectPath: parseRedirectPath(body),
    });
    return { url };
  }
  const url = await googleIdentityService.beginSignIn({ redirectPath: parseRedirectPath(body) });
  return { url };
}

// Called from the callback route. For login, returns the session token to set as a
// cookie. For linking, the session already exists; nothing to mint.
async function completeCallback(request: NextRequest): Promise<{
  token?: string;
  user?: unknown;
  redirectPath: string;
}> {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code") ?? "";

  const flow = await oauthFlowRepository.findByState(state);
  if (!flow || flow.state !== state) {
    throw new AppError(GOOGLE_ERRORS.OAUTH_STATE_EXPIRED, 409, ERROR_CODES.OAUTH_STATE_EXPIRED);
  }
  if (flow.expiresAt && flow.expiresAt < new Date()) {
    throw new AppError(GOOGLE_ERRORS.OAUTH_STATE_EXPIRED, 409, ERROR_CODES.OAUTH_STATE_EXPIRED);
  }

  if (flow.purpose === "link") {
    const auth = await getAuthPayload();
    if (flow.userId?.toString() !== auth.id) {
      throw new AppError(GOOGLE_ERRORS.OAUTH_STATE_EXPIRED, 409, ERROR_CODES.OAUTH_STATE_EXPIRED);
    }
    await googleIdentityService.completeLink({
      callbackUrl: request.url,
      state,
      sessionUserId: auth.id,
    });
    const user = await userService.getCurrentUser(auth.id);
    return { user, redirectPath: "/auth/link?status=success" };
  }

  const result = await googleIdentityService.completeSignIn({
    callbackUrl: request.url,
    state,
    redirectPath: flow.redirectPath ?? "/",
  });
  return { token: result.token, user: result.user, redirectPath: result.redirectPath ?? "/" };
}

async function unlinkGoogle(): Promise<{ linked: boolean }> {
  const auth = await getAuthPayload();
  return googleIdentityService.unlinkGoogle(auth.id);
}

const googleController = {
  beginSignIn,
  completeCallback,
  unlinkGoogle,
};

export default googleController;
