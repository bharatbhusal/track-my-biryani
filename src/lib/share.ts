import { toast } from "sonner";

type SharePayload = {
  url: string;
  title?: string;
  text?: string;
};

export async function shareLink({ url, title, text }: SharePayload) {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch {
      // User cancelled
      return;
    }
  }

  await navigator.clipboard.writeText(url);
  toast.success("Link copied!");
}
