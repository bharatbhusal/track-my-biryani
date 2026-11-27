import Link from "next/link";

import { Card, CardTitle } from "@/components/ui/card";
import { getAuthPayload } from "@/lib/auth";
import googleIdentityService from "@/services/google-identity.service";
import { CredentialsForm } from "@/features/auth/credentials-form";

export const metadata = {
  title: "Update credentials",
};

export default async function CredentialsPage() {
  const auth = await getAuthPayload().catch(() => null);

  if (!auth) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardTitle className="mb-4 text-lg">Update credentials</CardTitle>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          Sign in to update your username or password.
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

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardTitle className="mb-4 text-lg">Update credentials</CardTitle>
      <CredentialsForm
        initialUsername={auth.username}
        hasPassword={status.hasPassword}
        isGoogleLinked={status.linked}
      />
    </Card>
  );
}
