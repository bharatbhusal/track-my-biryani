'use client';

import { useEffect } from 'react';

import { useUIStore } from '@/store/ui-store';

const DEFAULT_LOCALE = 'en-US';
const DEFAULT_CURRENCY = 'INR';
const DEFAULT_TIMEZONE = 'Asia/Kolkata';

const CURRENCY_BY_REGION: Record<string, string> = {
  IN: 'INR',
  NP: 'NPR',
  US: 'USD',
  GB: 'GBP',
  AU: 'AUD',
  CA: 'CAD',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  JP: 'JPY',
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

    const locale = navigator.language || DEFAULT_LOCALE;
    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      DEFAULT_TIMEZONE;

    setPreferences({
      locale,
      currency: detectCurrency(locale),
      timezone,
      hapticFeedback: true,
      detectionCompleted: true,
    });
  }, [detectionCompleted, setPreferences]);
}
