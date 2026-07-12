"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setLocationPermission } from "@/store/slices/uiSlice";
import { LocationPermissionBanner } from "./location-permission-banner";

export function LocationPermissionProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const dispatch = useAppDispatch();
	const permission = useAppSelector((s) => s.ui.locationPermission);

	useEffect(() => {
		// Only sync with browser if Redux is still "prompt" (user hasn't made a choice yet)
		if (permission !== "prompt") return;
		if (!navigator.permissions) return;

		const checkPermission = async () => {
			try {
				const perm = await navigator.permissions.query({ name: "geolocation" });
				const mapPermission = (state: PermissionState): "granted" | "denied" | "prompt" => {
					if (state === "granted") return "granted";
					if (state === "denied") return "denied";
					return "prompt";
				};

				const currentPerm = mapPermission(perm.state);
				if (currentPerm !== "prompt") {
					dispatch(setLocationPermission(currentPerm));
				}

				const handleChange = () => {
					const newPerm = mapPermission(perm.state);
					if (newPerm !== "prompt") {
						dispatch(setLocationPermission(newPerm));
					}
				};

				perm.addEventListener("change", handleChange);
				return () => perm.removeEventListener("change", handleChange);
			} catch {
				// Keep as "prompt" if query fails
			}
		};

		checkPermission();
	}, [dispatch, permission]);

	if (permission === "prompt") {
		return (
			<>
				{children}
				<LocationPermissionBanner />
			</>
		);
	}

	return <>{children}</>;
}