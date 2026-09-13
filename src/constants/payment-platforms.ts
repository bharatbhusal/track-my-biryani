export const PAYMENT_PLATFORMS = {
  GOOGLE_PAY: "gpay",
  PHONE_PE: "phonepe",
  PAYTM: "paytmmp",
  UPI: "upi",
} as const;

export const PAYMENT_URL = {
  GOOGLE_PAY: "gpay://",
  PHONE_PE: "phonepe://",
  PAYTM: "paytmmp://",
  UPI: "upi://",
} as const;

export type PaymentPlatform = (typeof PAYMENT_PLATFORMS)[keyof typeof PAYMENT_PLATFORMS];
export type PaymentUrl = (typeof PAYMENT_URL)[keyof typeof PAYMENT_URL];
