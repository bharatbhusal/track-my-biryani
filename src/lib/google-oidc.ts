import * as client from "openid-client";

import { env } from "@/config/env";
import { AppError } from "@/lib/errors";
import { ERROR_CODES, GOOGLE_ERRORS } from "@/constants/error-messages";

export type GoogleClaims = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  emailVerified: boolean;
};

export type OAuthFlowMaterial = {
  state: string;
  nonce: string;
  codeVerifier: string;
  codeChallenge: string;
};

let configurationPromise: Promise<client.Configuration> | null = null;

function getConfiguration(): Promise<client.Configuration> {
  configurationPromise ??= client.discovery(
    new URL("https://accounts.google.com"),
    env.AUTH_GOOGLE_ID,
    {
      client_secret: env.AUTH_GOOGLE_SECRET,
      redirect_uris: [env.AUTH_GOOGLE_REDIRECT_URI],
    },
  );
  return configurationPromise;
}

export async function createFlowMaterial(): Promise<OAuthFlowMaterial> {
  const codeVerifier = client.randomPKCECodeVerifier();
  return {
    state: client.randomState(),
    nonce: client.randomNonce(),
    codeVerifier,
    codeChallenge: await client.calculatePKCECodeChallenge(codeVerifier),
  };
}

export async function buildAuthorizationUrl(material: OAuthFlowMaterial): Promise<URL> {
  const config = await getConfiguration();
  return client.buildAuthorizationUrl(config, {
    response_type: "code",
    redirect_uri: env.AUTH_GOOGLE_REDIRECT_URI,
    scope: "openid email profile",
    state: material.state,
    nonce: material.nonce,
    code_challenge: material.codeChallenge,
    code_challenge_method: "S256",
    // Force Google to show the account chooser so users can switch between
    // Google accounts instead of silently reusing the last signed-in one.
    prompt: "select_account",
  });
}

// callbackUrl is the ORIGINAL URL Google redirected to (contains iss, state, code).
export async function exchangeAuthorizationCode(
  callbackUrl: string,
  material: Pick<OAuthFlowMaterial, "state" | "nonce" | "codeVerifier">,
): Promise<GoogleClaims> {
  const config = await getConfiguration();

  const response = await (async () => {
    try {
      return await client.authorizationCodeGrant(config, new URL(callbackUrl), {
        expectedState: material.state,
        expectedNonce: material.nonce,
        pkceCodeVerifier: material.codeVerifier,
      });
    } catch (error) {
      throw new AppError(
        GOOGLE_ERRORS.OAUTH_EXCHANGE_FAILED,
        400,
        ERROR_CODES.GOOGLE_EXCHANGE_FAILED,
      );
    }
  })();

  const claims = response.claims();
  if (!claims || !claims.sub) {
    throw new AppError(GOOGLE_ERRORS.SUB_MISSING, 400);
  }
  if (claims.email_verified !== true) {
    throw new AppError(GOOGLE_ERRORS.EMAIL_NOT_VERIFIED, 400);
  }
  return {
    sub: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
    name: typeof claims.name === "string" ? claims.name : undefined,
    picture: typeof claims.picture === "string" ? claims.picture : undefined,
    emailVerified: claims.email_verified === true,
  };
}
