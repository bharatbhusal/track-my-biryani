'use client';

import { useState } from 'react';

type GeoPoint = {
  latitude: number;
  longitude: number;
};

export function useGeolocation() {
  const [isLoading, setIsLoading] = useState(false);

  const detect = async (): Promise<GeoPoint | null> => {
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
          timeout: 7000,
        },
      );
    });

    setIsLoading(false);
    return result;
  };

  return { detect, isLoading };
}
