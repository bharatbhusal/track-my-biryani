"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { debounce } from "@/lib/utils";

const schema = z.object({
  username: z.string().trim().toLowerCase().optional(),
  password: z.string().min(8).optional(),
});

type Values = z.infer<typeof schema>;

export function CredentialsForm({
  initialUsername,
  hasPassword,
  isGoogleLinked,
}: {
  initialUsername: string;
  hasPassword: boolean;
  isGoogleLinked: boolean;
}) {
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { username: initialUsername, password: undefined },
  });
  const {
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = form;
  const fieldErrors = errors as Record<string, { message?: string }>;
  const getFieldError = (field: string) => fieldErrors[field]?.message;

  const username = watch("username");
  const isPasswordFieldRequired = !hasPassword;

  const checkUsername = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 6) {
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

  const onSubmit = async (values: Values) => {
    const updates: { username?: string; password?: string } = {};
    if (values.username !== undefined && values.username.trim() !== "") {
      updates.username = values.username.trim();
    }
    if (values.password !== undefined && values.password.trim() !== "") {
      updates.password = values.password;
    }

    if (Object.keys(updates).length === 0) {
      toast.error("Nothing to update.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.updateCredentials(updates);
      toast.success("Credentials updated.");
      setUsernameStatus("idle");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardTitle className="mb-2 text-lg">Update credentials</CardTitle>
      <p className="mb-3 text-sm text-[var(--color-muted)]">
        {isGoogleLinked && !hasPassword
          ? "This account is linked to Google and has no password. Set a password so you can sign in with username/password or unlink Google later."
          : "Update your username and/or password."}
      </p>
      <div className="space-y-3">
        <Form {...form}>
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <FormField
              control={control}
              name={"username" as const}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. jdoe"
                      disabled={usernameStatus === "checking" || isSubmitting}
                    />
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
            <FormField
              control={control}
              name={"password" as const}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Password{isPasswordFieldRequired ? " *" : ""}
                  </FormLabel>
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
            <p className="text-xs text-[var(--color-muted)]">
              Leave a field blank to keep the current value.
            </p>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || usernameStatus === "checking"}
            >
              {isSubmitting ? "Updating…" : "Update credentials"}
            </Button>
          </form>
        </Form>
      </div>
    </Card>
  );
}
