export const DEVICES = {
  IOS: "ios",
  ANDROID: "android",
  OTHER: "other",
} as const;

export type DeviceType = (typeof DEVICES)[keyof typeof DEVICES];
