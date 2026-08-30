"use client";

// Store defaults (en-IN / INR / Asia/Kolkata) are the correct values.
// Auto-detection via navigator.language is disabled because it
// overrides these defaults with the browser locale (e.g. en-US -> USD).

export function useLocalePreferences(): void {
  // no-op
}
