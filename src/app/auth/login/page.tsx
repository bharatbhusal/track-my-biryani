import { AuthForm } from "@/features/auth/auth-form";

export const metadata = {
  title: "Login",
};

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  cancelled: "Google sign-in was cancelled.",
  state_expired: "The sign-in request expired. Please try again.",
  google_already_linked: "This Google account is already linked to another user.",
  oauth_exchange_failed:
    "Google sign-in failed while processing the response from Google. Please try again.",
  not_linked: "This account is not linked to Google.",
  failed: "Google sign-in failed. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; oauthError?: string }>;
}) {
  const { next, oauthError } = await searchParams;
  const oauthErrorMessage = oauthError ? OAUTH_ERROR_MESSAGES[oauthError] : undefined;

  return <AuthForm mode="login" nextPath={next} oauthError={oauthErrorMessage} />;
}
