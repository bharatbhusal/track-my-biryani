import { NextRequest, NextResponse } from "next/server";

import googleController from "@/controllers/google.controller";
import { errorResponse } from "@/lib/api-response";
import { setAuthCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { ERROR_CODES, GOOGLE_ERRORS } from "@/constants/error-messages";
import oauthFlowRepository from "@/repositories/oauth-flow.repository";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const error = new URL(request.url).searchParams.get("error");
    const hasCode = new URL(request.url).searchParams.get("code");
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
    if (error instanceof AppError && error.code === ERROR_CODES.GOOGLE_CANCELLED) {
      const state = new URL(request.url).searchParams.get("state") ?? "";
      const flow = await oauthFlowRepository.findByState(state);
      const target =
        flow?.purpose === "link"
          ? "/auth/link?oauthError=cancelled"
          : "/auth/login?oauthError=cancelled";
      return NextResponse.redirect(new URL(target, request.url), 303);
    }
    if (error instanceof AppError && error.code === ERROR_CODES.OAUTH_STATE_EXPIRED) {
      return NextResponse.redirect(
        new URL("/auth/login?oauthError=state_expired", request.url),
        303,
      );
    }
    return errorResponse(error);
  }
}
