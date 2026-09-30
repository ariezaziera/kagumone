/** Active use keeps a session open. Quiet time ends it. */
export const BROWSER_IDLE_MS = 30 * 60 * 1000;
export const REMEMBER_IDLE_SECONDS = 8 * 60 * 60;
export const REMEMBER_MAX_MS = 14 * 24 * 60 * 60 * 1000;
export const SESSION_UPDATE_AGE_SECONDS = 5 * 60;

export function isShortSessionCookie(cookieHeader: string | null) {
  return Boolean(cookieHeader?.includes("dont_remember"));
}
