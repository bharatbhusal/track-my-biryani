import Link from "next/link";

import { Card, CardTitle } from "@/components/ui/card";
import { GoogleButton } from "@/features/auth/google-button";
import { UnlinkButton } from "@/features/auth/unlink-button";
import { getAuthPayload } from "@/lib/auth";
import googleIdentityService from "@/services/google-identity.service";

export const metadata = {
  title: "Connect Google",
};

type LinkPageProps = {
  searchParams: Promise<{ status?: string; oauthError?: string }>;
};

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  cancelled: "You cancelled the connection to Google.",
  state_expired: "The sign-in request expired. Please try again.",
  google_error: "Google sign-in failed. Please try again.",
  failed: "Google sign-in failed. Please try again.",
};

export default async function LinkPage({ searchParams }: LinkPageProps) {
  const params = await searchParams;
  const auth = await getAuthPayload().catch(() => null);

  if (!auth) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardTitle className="mb-4 text-lg">Connect Google to your account</CardTitle>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          Sign in to your account, then connect Google to it.
        </p>
        <Link
          href="/auth/login"
          className="inline-block rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)]"
        >
          Sign in
        </Link>
      </Card>
    );
  }

  const status = await googleIdentityService.getStatus(auth.id);
  const oauthError = params.oauthError ? OAUTH_ERROR_MESSAGES[params.oauthError] : null;
  const success = params.status === "success";

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardTitle className="mb-4 text-lg">Connect Google to your account</CardTitle>
      {success && (
        <p role="status" className="mb-3 text-sm text-[var(--color-muted)]">
          Your account is now connected to Google.
        </p>
      )}
      {oauthError && (
        <p role="alert" className="mb-3 text-sm text-[var(--color-danger)]">
          {oauthError}
        </p>
      )}
      {status.linked ? (
        <>
          <p className="mb-3 text-sm text-[var(--color-muted)]">
            Your account is connected to Google ({status.googleSub?.slice(0, 8)}…).
          </p>
          {!status.hasPassword && (
            <p className="mb-3 text-sm text-[var(--color-muted)]">
              You have no password set.{" "}
              <Link
                href="/auth/credentials"
                className="underline text-[var(--color-primary)]"
              >
                Set a password
              </Link>{" "}
              so you can sign in with username/password or unlink Google later.
            </p>
          )}
          {status.hasPassword && <UnlinkButton />}
          {!status.hasPassword && (
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              You cannot unlink Google until you set a password.
            </p>
          )}
        </>
      ) : (
        <div>
          <p className="mb-3 text-sm">
            Connect Google to your account for a simpler sign-in. You stay signed in to this account
            unless you confirm the change.
          </p>
          <GoogleButton mode="link" redirectPath="/auth/link" />
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            You can unlink at any time while another way to sign in is available.
          </p>
        </div>
      )}
    </Card>
  );
}
