import { NextRequest, NextResponse } from "next/server";

import googleController from "@/controllers/google.controller";
import { getAuthPayload, setAuthCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { ERROR_CODES, GOOGLE_ERRORS } from "@/constants/error-messages";
import oauthFlowRepository from "@/repositories/oauth-flow.repository";

function flowPurpose(state: string): Promise<string | null> {
  return oauthFlowRepository.findByState(state).then(
    (flow) => (flow ? flow.purpose : null),
    () => null,
  );
}

// Safe error codes that can be surfaced to the user. Anything not listed maps to
// a generic "failed" message to avoid leaking internal details.
const USER_SAFE_ERROR_CODES: Record<string, string> = {
  [ERROR_CODES.GOOGLE_ALREADY_LINKED]: "google_already_linked",
  [ERROR_CODES.GOOGLE_EXCHANGE_FAILED]: "oauth_exchange_failed",
  [ERROR_CODES.NOT_LINKED]: "not_linked",
};

function errorMessageKey(error: unknown): string {
  if (error instanceof AppError && error.code) {
    return USER_SAFE_ERROR_CODES[error.code] ?? "failed";
  }
  return "failed";
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const url = new URL(request.url);
    const error = url.searchParams.get("error");
    const hasCode = url.searchParams.get("code");
    if (error && !hasCode) {
      throw new AppError(
        error === "access_denied" ? GOOGLE_ERRORS.CANCELLED : "Google sign-in failed",
        409,
        ERROR_CODES.GOOGLE_CANCELLED,
      );
    }

    const result = await googleController.completeCallback(request);
    if (result.token) {
      await setAuthCookie(result.token);
    }
    return NextResponse.redirect(new URL(result.redirectPath, request.url), 303);
  } catch (error) {
    const state = new URL(request.url).searchParams.get("state") ?? "";
    const purpose = await flowPurpose(state);
    // A link flow's state may already be deleted when it errors; a valid session
    // means the user was linking, so send them back to the profile page.
    const isLoggedIn = await getAuthPayload().then(
      () => true,
      () => false,
    );
    const target = purpose === "link" || (!purpose && isLoggedIn) ? "/profile" : "/auth/login";

    let key = errorMessageKey(error);
    if (error instanceof AppError && error.code === ERROR_CODES.GOOGLE_CANCELLED) {
      key = "cancelled";
    } else if (error instanceof AppError && error.code === ERROR_CODES.OAUTH_STATE_EXPIRED) {
      key = "state_expired";
    }

    return NextResponse.redirect(new URL(`${target}?oauthError=${key}`, request.url), 303);
  }
}
