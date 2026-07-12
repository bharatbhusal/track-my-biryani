"use client";

import { useCallback, useState } from "react";
import { useAppSelector } from "@/store/hooks";

const GEOLOCATION_TIMEOUT_MS = 10000;

type GeoPoint = {
	latitude: number;
	longitude: number;
};

export function useGeolocation() {
	const [isLoading, setIsLoading] = useState(false);
	const permission = useAppSelector((s) => s.ui.locationPermission);

	const getCurrentLocation = useCallback(async (): Promise<GeoPoint | null> => {
		if (!navigator.geolocation) return null;

		if (permission === "denied") return null;

		setIsLoading(true);

		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: GEOLOCATION_TIMEOUT_MS,
				});
			});

			return {
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
			};
		} catch {
			return null;
		} finally {
			setIsLoading(false);
		}
	}, [permission]);

	const requestPermission = useCallback(async (): Promise<GeoPoint | null> => {
		if (!navigator.geolocation) return null;

		setIsLoading(true);

		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: GEOLOCATION_TIMEOUT_MS,
				});
			});

			return {
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
			};
		} catch {
			return null;
		} finally {
			setIsLoading(false);
		}
	}, []);

	return { getCurrentLocation, requestPermission, isLoading, permission };
}