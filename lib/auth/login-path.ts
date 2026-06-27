/** Default login entry — magic link; password/OTP via in-UI toggles on auth pages. */
export const AUTH_LOGIN_PATH = "/auth/magic-link";

export function authLoginUrl(redirectPath?: string): string {
  if (!redirectPath) return AUTH_LOGIN_PATH;
  return `${AUTH_LOGIN_PATH}?redirect=${encodeURIComponent(redirectPath)}`;
}
