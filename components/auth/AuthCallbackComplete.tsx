"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { AUTH_LOGIN_PATH } from "@/lib/auth/login-path";
import {
  clearRedirectAfterLogin,
  getRedirectAfterLogin,
} from "@/lib/redirect-after-login";

/**
 * After OAuth / magic-link lands on /auth/callback, confirm the session via the
 * API proxy (sets cookies) and send the user to their intended destination.
 */
export default function AuthCallbackComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let cancelled = false;

    async function finish() {
      // AuthView handles token exchange; give it a tick then verify session.
      await new Promise((resolve) => setTimeout(resolve, 150));

      for (let attempt = 0; attempt < 8 && !cancelled; attempt++) {
        const { data, error } = await authClient.getSession({
          query: { disableCookieCache: true },
        });

        if (data?.user) {
          const stored = getRedirectAfterLogin();
          if (stored) clearRedirectAfterLogin();
          router.replace(stored ?? "/");
          router.refresh();
          return;
        }

        if (error) break;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      if (!cancelled) {
        router.replace(AUTH_LOGIN_PATH);
      }
    }

    finish();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <p className="text-center text-sm text-black/60 mt-4">
      Completing sign-in…
    </p>
  );
}
