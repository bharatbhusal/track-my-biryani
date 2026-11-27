"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/modals/dialog";
import { GoogleButton } from "@/features/auth/google-button";
import type { ProfileUser } from "@/constants/types/auth.types";
import { authApi } from "@/lib/api/auth";
import { debounce } from "@/lib/utils";
import Image from "next/image";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Full name is required"),
  username: z.string().trim().toLowerCase().min(6).max(20),
  password: z.string().min(8).optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

export function ProfileView({
  initialProfile,
  oauthError,
  justLinked,
}: {
  initialProfile: ProfileUser;
  oauthError?: string;
  justLinked?: boolean;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">(
    "idle",
  );

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialProfile.name,
      username: initialProfile.username,
      password: undefined,
    },
  });
  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = form;
  const fieldErrors = errors as Record<string, { message?: string }>;
  const getFieldError = (field: string) => fieldErrors[field]?.message;

  useEffect(() => {
    if (oauthError) {
      toast.error(oauthError);
    } else if (justLinked) {
      toast.success("Your account is now connected to Google.");
    }
  }, [oauthError, justLinked]);

  const username = watch("username");
  const checkUsername = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 6 || trimmed === initialProfile.username) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    try {
      const { available } = await authApi.checkUsername(trimmed);
      setUsernameStatus(available ? "available" : "taken");
    } catch {
      setUsernameStatus("idle");
    }
  };

  useEffect(() => {
    const debounced = debounce(checkUsername as (...args: unknown[]) => unknown, 400);
    debounced(username);
  }, [username]);

  const refresh = async () => {
    const next = await authApi.me();
    setProfile(next);
    reset({
      name: next.name,
      username: next.username,
      password: undefined,
    });
  };

  const onSubmit = async (values: ProfileValues) => {
    const updates: { name: string; username: string; password?: string } = {
      name: values.name,
      username: values.username,
    };
    if (profile.hasPassword && values.password) {
      updates.password = values.password;
    }

    try {
      await authApi.updateCredentials(updates);
      await refresh();
      setUsernameStatus("idle");
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  const onUnlink = async () => {
    setUnlinkOpen(false);
    try {
      await authApi.unlinkGoogle();
      await refresh();
      toast.success("Google unlinked.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unlink failed");
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Profile</h2>

      <Card className="flex items-center gap-4">
        {profile.avatar ? (
          <Image
            src={profile.avatar}
            alt="Profile picture"
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            aria-label="Profile picture"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-muted)] text-xl font-semibold text-[var(--color-primary)]"
          >
            {initials(profile.name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium">{profile.name}</p>
          <p className="truncate text-sm text-[var(--color-muted)]">@{profile.username}</p>
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-3 text-base">Account details</CardTitle>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-muted)]">Full name</dt>
            <dd className="truncate text-right">{profile.name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-muted)]">Username</dt>
            <dd className="truncate text-right">{profile.username}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-muted)]">Google account</dt>
            <dd className="truncate text-right">
              {profile.googleLinked ? (profile.googleEmail ?? "Connected") : "Not linked"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-muted)]">Password</dt>
            <dd className="text-right">{profile.hasPassword ? "Set" : "Not set"}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardTitle className="mb-3 text-base">Edit profile</CardTitle>
        <Form {...form}>
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage>{getFieldError("name")}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={usernameStatus === "checking" || isSubmitting} />
                  </FormControl>
                  {usernameStatus === "checking" && (
                    <FormMessage>Checking availability…</FormMessage>
                  )}
                  {usernameStatus === "taken" && (
                    <FormMessage>Username is already taken.</FormMessage>
                  )}
                  {usernameStatus === "available" && (
                    <p className="text-xs text-[var(--color-muted)]">Username is available.</p>
                  )}
                  {getFieldError("username")}
                </FormItem>
              )}
            />
            {profile.hasPassword && (
              <FormField
                control={control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        placeholder="••••••••"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage>{getFieldError("password")}</FormMessage>
                  </FormItem>
                )}
              />
            )}
            {!profile.hasPassword && (
              <p className="text-xs text-[var(--color-muted)]">
                This account was created with Google and has no password, so password changes are
                unavailable.
              </p>
            )}
            {profile.hasPassword && (
              <p className="text-xs text-[var(--color-muted)]">
                Leave the password blank to keep the current one.
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || usernameStatus === "checking" || usernameStatus === "taken"}
            >
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </Form>
      </Card>

      <Card>
        <CardTitle className="mb-3 text-base">Google connection</CardTitle>
        {profile.googleLinked ? (
          <div className="space-y-2">
            <p className="text-sm text-[var(--color-muted)]">
              Connected{profile.googleEmail ? ` as ${profile.googleEmail}` : ""}.
            </p>
            {profile.hasPassword ? (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => setUnlinkOpen(true)}
              >
                Unlink Google
              </Button>
            ) : (
              <p className="text-xs text-[var(--color-muted)]">
                You cannot unlink Google because this account has no password to sign in with.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-[var(--color-muted)]">
              Connect Google to sign in with one click.
            </p>
            <GoogleButton mode="link" redirectPath="/profile" />
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={unlinkOpen}
        title="Unlink Google"
        subtitle="Disconnect your Google account"
        description="You will need to use your username and password to sign in afterwards."
        onCancel={() => setUnlinkOpen(false)}
        onConfirm={onUnlink}
      />
    </div>
  );
}
