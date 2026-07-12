"use client";

import { useCallback, useState } from "react";

const GEOLOCATION_TIMEOUT_MS = 10000;

type GeoPoint = {
	latitude: number;
	longitude: number;
};

type GeolocationResult =
	| { success: true; data: GeoPoint }
	| { success: false; error: GeolocationPositionError };

export function useGeolocation() {
	const [isLoading, setIsLoading] = useState(false);

	const getCurrentLocation = useCallback(async (): Promise<GeolocationResult> => {
		if (!navigator.geolocation) {
			return { success: false, error: { code: 0, message: "Geolocation not supported", PERMISSION_DENIED: 1 } as GeolocationPositionError };
		}

		setIsLoading(true);

		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: GEOLOCATION_TIMEOUT_MS,
				});
			});

			return {
				success: true,
				data: {
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				},
			};
		} catch (err) {
			const error = err as GeolocationPositionError;
			return { success: false, error };
		} finally {
			setIsLoading(false);
		}
	}, []);

	return { getCurrentLocation, isLoading };
}