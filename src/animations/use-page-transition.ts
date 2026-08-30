"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

export function usePageTransition(routeKey: string) {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;

      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 16, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          ease: "power3.out",
        },
      );

      const animatedNodes = ref.current.querySelectorAll("[data-animate]");
      if (animatedNodes.length > 0) {
        gsap.set(animatedNodes, { opacity: 0, y: 12 });
        gsap.to(animatedNodes, {
          opacity: 1,
          y: 0,
          duration: 0.35,
          ease: "power2.out",
          stagger: 0.06,
          delay: 0.1,
          onComplete: () => {
            animatedNodes.forEach((node) => (node as HTMLElement).classList.add("gsap-done"));
          },
        });
      }
    },
    { dependencies: [routeKey] },
  );

  return ref;
}
