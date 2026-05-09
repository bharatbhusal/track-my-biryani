"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

export function usePageTransition(routeKey: string) {
	const ref = useRef<HTMLDivElement | null>(null);

	useGSAP(
		() => {
			if (!ref.current) return;
			const reduceMotion = window.matchMedia(
				"(prefers-reduced-motion: reduce)",
			).matches;
			if (reduceMotion) {
				return;
			}

			gsap.fromTo(
				ref.current,
				{ opacity: 0, y: 12 },
				{
					opacity: 1,
					y: 0,
					duration: 0.35,
					ease: "power2.out",
				},
			);

			const animatedNodes = ref.current.querySelectorAll(
				"[data-animate]",
			);
			if (animatedNodes.length > 0) {
				gsap.fromTo(
					animatedNodes,
					{ opacity: 0, y: 10 },
					{
						opacity: 1,
						y: 0,
						duration: 0.28,
						ease: "power2.out",
						stagger: 0.05,
						delay: 0.05,
					},
				);
			}
		},
		{ dependencies: [routeKey] },
	);

	return ref;
}
