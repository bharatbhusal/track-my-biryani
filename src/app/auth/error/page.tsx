import Link from "next/link";

export const metadata = {
  title: "Sign-in error",
};

type SearchParams = {
  message?: string;
  code?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  google_already_linked: "This Google account is already linked to another user.",
  oauth_exchange_failed: "Google sign-in failed while processing the response from Google. Please try again.",
  email_not_verified: "Your Google email is not verified. Please contact support.",
  google_not_configured: "Google sign-in is not configured. Contact the administrator.",
  not_linked: "This account is not linked to Google.",
  username_in_use: "Username already in use. Please try again.",
  failed: "Google sign-in failed. Please try again.",
};

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { message, code } = await searchParams;
  const friendly =
    message
      ? ERROR_MESSAGES[message] ?? message
      : code
        ? ERROR_MESSAGES[code] ?? code
        : undefined;

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold mb-2">Sign-in error</h2>
          {friendly && (
            <p role="alert" className="mb-4 text-sm text-[var(--color-danger)]">
              {friendly}
            </p>
          )}
          <Link
            href="/auth/login"
            className="inline-block rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)]"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
