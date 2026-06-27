import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";
import { REDIRECT_AFTER_LOGIN_COOKIE_NAME } from "@/lib/redirect-after-login";

import { AUTH_LOGIN_PATH } from "@/lib/auth/login-path";

const authMiddleware = auth.middleware({
  loginUrl: AUTH_LOGIN_PATH,
});

const PROTECTED_PREFIXES = ["/admin", "/account", "/checkout"];

function redirectAfterLoginIfPresent(request: NextRequest) {
  const cookie = request.cookies.get(REDIRECT_AFTER_LOGIN_COOKIE_NAME);
  const value = cookie?.value?.trim();
  if (!value) return null;

  let path: string;
  try {
    path = decodeURIComponent(value);
  } catch {
    return null;
  }
  if (!path.startsWith("/") || path.startsWith("//")) {
    return null;
  }

  const res = NextResponse.redirect(new URL(path, request.url));
  res.cookies.set(REDIRECT_AFTER_LOGIN_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  return res;
}

export default async function proxy(request: NextRequest) {
  if (request.headers.has("Next-Action")) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Homepage is public — only handle post-login redirect cookie here.
  // Do not require auth on "/" or magic-link/OAuth return params are lost.
  if (pathname === "/") {
    const redirect = redirectAfterLoginIfPresent(request);
    return redirect ?? NextResponse.next();
  }

  if (!PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  return authMiddleware(request);
}

export const config = {
  matcher: ["/", "/admin/:path*", "/account/:path*", "/checkout/:path*"],
};
