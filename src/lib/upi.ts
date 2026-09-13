"use client";

import { PAYMENT_URL } from "@/constants/payment-platforms";

export interface UpiParams {
  pa: string; // UPI ID (e.g., user@bank)
  pn: string; // Payee name
  am: number; // Amount
  tn?: string; // Transaction note
  cu?: string; // Currency (default: INR)
}

export function buildUpiUrl(params: UpiParams): string {
  const searchParams = new URLSearchParams({
    pa: params.pa,
    pn: params.pn,
    am: params.am.toFixed(2),
    cu: params.cu || "INR",
  });

  if (params.tn) {
    searchParams.set("tn", params.tn);
  }

  return `upi://pay?${searchParams.toString()}`;
}

export function getPlatformSpecificUrls(upiUrl: string) {
  return {
    gpay: upiUrl.replace(PAYMENT_URL.UPI, PAYMENT_URL.GOOGLE_PAY),
    phonepe: upiUrl.replace(PAYMENT_URL.UPI, PAYMENT_URL.PHONE_PE),
    paytm: upiUrl.replace(PAYMENT_URL.UPI, PAYMENT_URL.PAYTM),
    generic: upiUrl,
  };
}
