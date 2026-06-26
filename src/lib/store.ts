// Sends the user to the right app store based on their device:
//   Apple (iPhone / iPad / iPod / Mac) → App Store
//   Everything else (Windows, Android, …) → Play Store
//
// ⚠️ Replace the two placeholder URLs below with your real store links.

export const APP_STORE_URL = "https://apps.apple.com/app/id000000000";
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.yourcompany.happyour";

export function getStoreUrl(): string {
  if (typeof navigator === "undefined") return PLAY_STORE_URL;

  const ua = navigator.userAgent;
  // iPadOS 13+ reports as "MacIntel" but has a touch screen.
  const isIpadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const isApple = /iPhone|iPad|iPod|Macintosh/i.test(ua) || isIpadOS;

  return isApple ? APP_STORE_URL : PLAY_STORE_URL;
}

export function openStore(): void {
  if (typeof window === "undefined") return;
  window.open(getStoreUrl(), "_blank", "noopener,noreferrer");
}
