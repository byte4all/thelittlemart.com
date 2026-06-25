import { createNeonAuth } from "@neondatabase/auth/next/server";
import { resolveNeonAuthBaseUrl } from "./resolve-base-url";

const baseUrl = resolveNeonAuthBaseUrl();
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET?.trim();

if (!cookieSecret) {
  throw new Error(
    "NEON_AUTH_COOKIE_SECRET is not set. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
  );
}

if (cookieSecret.length < 32) {
  throw new Error(
    "NEON_AUTH_COOKIE_SECRET must be at least 32 characters. Generate a new secret with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
  );
}

/** Neon Auth server instance — use `auth` per current Neon docs. */
export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
    sameSite: "lax",
  },
  logLevel: process.env.NODE_ENV === "development" ? "debug" : "warn",
});

/** @deprecated Use `auth` instead */
export const neonAuth = auth;
