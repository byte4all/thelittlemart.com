"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/lib/auth/client";
import { getRedirectAfterLogin, clearRedirectAfterLogin } from "@/lib/redirect-after-login";

/**
 * When a user is signed in via Neon Auth, call /api/auth/sync so they are upserted
 * into our Prisma users table. This runs once per mount when user is present.
 * If we have a redirect-after-login (cookie or sessionStorage, set when visiting
 * sign-in?redirect=/checkout), redirect the user there and clear it so they land
 * on checkout after "Go to Checkout" → sign-in.
 */
export default function AuthSync() {
  const router = useRouter();
  const user = useAuthUser();
  const synced = useRef(false);

  useEffect(() => {
    if (!user || synced.current) return;
    synced.current = true;
    const redirectUrl = getRedirectAfterLogin();
    if (redirectUrl) {
      clearRedirectAfterLogin();
      router.replace(redirectUrl);
    }
    fetch("/api/auth/sync", { credentials: "include" }).catch(() => {
      synced.current = false;
    });
  }, [user, router]);

  return null;
}
