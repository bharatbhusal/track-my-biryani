"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function UnlinkButton() {
  async function handleUnlink() {
    try {
      const response = await fetch("/api/auth/unlink", { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        toast.error(data?.error?.message ?? "Unlink failed");
        return;
      }
      toast.success("Google unlinked");
      // eslint-disable-next-line no-restricted-globals
      location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unlink failed");
    }
  }

  return (
    <Button type="button" variant="destructive" className="w-full" onClick={handleUnlink}>
      Unlink Google
    </Button>
  );
}
