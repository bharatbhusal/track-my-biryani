"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";
import { useMediaQuery } from "@/hooks/use-media-query";

export function ToastProvider() {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <Toaster
      position={isDesktop ? "top-right" : "top-center"}
      offset={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem + 4px)" }}
      mobileOffset={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem + 4px)" }}
      theme={theme}
    />
  );
}
