"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SCROLL_RESTORE_PENDING_KEY = "thelittlemart:scroll:pending";

/**
 * Shop layout: scroll to top when entering shop or changing filters
 * so the navbar and top of the page stay visible.
 */
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const pendingPath = sessionStorage.getItem(SCROLL_RESTORE_PENDING_KEY);
    if (pendingPath === currentPath) {
      return;
    }

    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    scrollToTop();
    const t1 = setTimeout(scrollToTop, 0);
    const t2 = setTimeout(scrollToTop, 50);
    const t3 = setTimeout(scrollToTop, 150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname, searchParams?.toString()]);

  return <>{children}</>;
}
