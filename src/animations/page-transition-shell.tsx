"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { usePageTransition } from "@/animations/use-page-transition";

export function PageTransitionShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ref = usePageTransition(pathname);

  return <div ref={ref}>{children}</div>;
}
