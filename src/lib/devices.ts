import { DEVICES } from "@/constants/devices";

export function detectPlatform() {
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    return DEVICES.IOS;
  }
  if (/Android/.test(navigator.userAgent)) {
    return DEVICES.ANDROID;
  }
  return DEVICES.OTHER;
}

export function isIOS(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}
