'use client';

import { useCallback, useState } from 'react';

const GEOLOCATION_TIMEOUT_MS = 7000;

type GeoPoint = {
  latitude: number;
  longitude: number;
};

export function useGeolocation() {
  const [isLoading, setIsLoading] = useState(false);

  const detect = useCallback(async (): Promise<GeoPoint | null> => {
    if (!navigator.geolocation) {
      return null;
    }

    setIsLoading(true);

    const result = await new Promise<GeoPoint | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: GEOLOCATION_TIMEOUT_MS,
        },
      );
    });

    setIsLoading(false);
    return result;
  }, []);

  return { detect, isLoading };
}
