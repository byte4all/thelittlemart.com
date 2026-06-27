"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { setRedirectAfterLoginCookie } from "@/lib/redirect-after-login";

/**
 * On login entry pages, store the redirect query param in a cookie (and sessionStorage)
 * so after login AuthSync can redirect the user to e.g. /checkout. Cookie survives
 * full-page redirects and same-tab magic-link returns.
 */
export default function StoreRedirectAfterLogin() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect && redirect.startsWith("/") && typeof window !== "undefined") {
      setRedirectAfterLoginCookie(redirect);
    }
  }, [searchParams]);

  return null;
}
