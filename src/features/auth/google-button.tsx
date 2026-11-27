"use client";

import { useState } from "react";
import { FaGoogle } from "react-icons/fa";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth";

type GoogleButtonProps = {
  mode: "login" | "link";
  redirectPath?: string;
  disabled?: boolean;
};

export function GoogleButton({ mode, redirectPath, disabled }: GoogleButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setPending(true);
    setError(null);
    try {
      const { url } = await authApi.startGoogle({ mode, redirectPath });
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setPending(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <p role="alert" className="text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onClick}
        disabled={disabled || pending}
      >
        {pending ? (
          <>
            <Spinner className="mr-2" />
            Redirecting...
          </>
        ) : (
          <>
            <FaGoogle className="mr-2" aria-hidden="true" />
            {mode === "login" ? "Continue with Google" : "Connect Google account"}
          </>
        )}
      </Button>
    </div>
  );
}
