import { redirect } from "next/navigation";

import { ProfileView } from "@/features/profile/profile-view";
import { getAuthPayload } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import userService from "@/services/user.service";

export const metadata = { title: "Profile" };

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  cancelled: "Google sign-in was cancelled.",
  state_expired: "The sign-in request expired. Please try again.",
  google_already_linked: "This Google account is already linked to another user.",
  oauth_exchange_failed: "Google sign-in failed. Please try again.",
  not_linked: "This account is not linked to Google.",
  failed: "Google sign-in failed. Please try again.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ oauthError?: string; status?: string }>;
}) {
  const auth = await getAuthPayload().catch(() => null);
  if (!auth) {
    redirect("/auth/login");
  }

  await connectToDatabase();
  const profile = await userService.getCurrentUser(auth.id);
  const { oauthError, status } = await searchParams;

  return (
    <ProfileView
      initialProfile={profile}
      oauthError={oauthError ? OAUTH_ERROR_MESSAGES[oauthError] : undefined}
      justLinked={status === "success"}
    />
  );
}
