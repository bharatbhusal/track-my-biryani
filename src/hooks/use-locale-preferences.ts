'use client';

import { useEffect } from 'react';

import { useUIStore } from '@/store/ui-store';

const DEFAULT_CURRENCY = 'INR';
const DEFAULT_TIMEZONE = 'Asia/Kolkata';

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

export function useLocalePreferences(): void {
  const setPreferences = useUIStore((state) => state.setPreferences);
  const detectionCompleted = useUIStore((state) => state.detectionCompleted);

  useEffect(() => {
    if (detectionCompleted) {
      return;
    }

    const locale = navigator.language || 'en-IN';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
    const currency = detectCurrency(locale);

    const commitPreferences = () => {
      setPreferences({
        locale,
        currency,
        timezone,
        hapticFeedback: true,
        detectionCompleted: true,
      });
    };

    if (!navigator.geolocation) {
      commitPreferences();
      return;
    }

    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((permission) => {
        if (permission.state === 'granted' || permission.state === 'prompt') {
          navigator.geolocation.getCurrentPosition(
            () => commitPreferences(),
            () => commitPreferences(),
            { timeout: 6000, enableHighAccuracy: false, maximumAge: 10 * 60 * 1000 },
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
