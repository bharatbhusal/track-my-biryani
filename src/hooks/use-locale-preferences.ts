'use client';

import { useEffect } from 'react';

import { useUIStore } from '@/store/ui-store';

const DEFAULT_CURRENCY = 'INR';
const DEFAULT_TIMEZONE = 'Asia/Kolkata';
const GEOLOCATION_TIMEOUT_MS = 6000;
const GEOLOCATION_MAX_AGE_MS = 10 * 60 * 1000;
const INDIA_BOUNDS = { minLat: 6, maxLat: 38, minLng: 68, maxLng: 98 };
const NEPAL_BOUNDS = { minLat: 26, maxLat: 31, minLng: 80, maxLng: 89 };

const CURRENCY_BY_REGION: Record<string, string> = {
  IN: 'INR',
  NP: 'NPR',
  US: 'USD',
  GB: 'GBP',
  AU: 'AUD',
  CA: 'CAD',
  EU: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  JP: 'JPY',
  CN: 'CNY',
  SG: 'SGD',
  AE: 'AED',
};

function detectCurrency(locale: string): string {
  const region = locale.split('-')[1]?.toUpperCase();
  if (!region) {
    return DEFAULT_CURRENCY;
  }

  return CURRENCY_BY_REGION[region] ?? DEFAULT_CURRENCY;
}

function mapCurrencyFromCoordinates(latitude: number, longitude: number): string | null {
  const isIndia =
    latitude >= INDIA_BOUNDS.minLat &&
    latitude <= INDIA_BOUNDS.maxLat &&
    longitude >= INDIA_BOUNDS.minLng &&
    longitude <= INDIA_BOUNDS.maxLng;
  const isNepal =
    latitude >= NEPAL_BOUNDS.minLat &&
    latitude <= NEPAL_BOUNDS.maxLat &&
    longitude >= NEPAL_BOUNDS.minLng &&
    longitude <= NEPAL_BOUNDS.maxLng;

  if (isIndia) return 'INR';
  if (isNepal) return 'NPR';
  return null;
}

export function useLocalePreferences(): void {
  const setPreferences = useUIStore((state) => state.setPreferences);
  const detectionCompleted = useUIStore((state) => state.detectionCompleted);

  useEffect(() => {
    if (detectionCompleted) {
      return;
    }

    const locale = navigator.language || 'en-IN';
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
    const currency = detectCurrency(locale);

    const commitPreferences = (overrides?: { currency?: string; timezone?: string }) => {
      setPreferences({
        locale,
        currency: overrides?.currency ?? currency,
        timezone: overrides?.timezone ?? browserTimezone,
        hapticFeedback: true,
        detectionCompleted: true,
      });
    };

    if (!navigator.geolocation) {
      commitPreferences();
      return;
    }

    if (!navigator.permissions) {
      commitPreferences();
      return;
    }

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((permission) => {
        if (permission.state === 'granted' || permission.state === 'prompt') {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const geoCurrency = mapCurrencyFromCoordinates(position.coords.latitude, position.coords.longitude);
              commitPreferences({
                currency: geoCurrency ?? currency,
                timezone: browserTimezone,
              });
            },
            () => commitPreferences(),
            { timeout: GEOLOCATION_TIMEOUT_MS, enableHighAccuracy: false, maximumAge: GEOLOCATION_MAX_AGE_MS },
          );
          return;
        }

        commitPreferences();
      })
      .catch(() => {
        commitPreferences();
      });
  }, [detectionCompleted, setPreferences]);
}
