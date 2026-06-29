"use client";

import { useLayoutEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SCROLL_RESTORE_PENDING_KEY = "thelittlemart:scroll:pending";
const SCROLL_RESTORE_PREFIX = "thelittlemart:scroll:";

export function getScrollStorageKey(path: string): string {
  return `${SCROLL_RESTORE_PREFIX}${path}`;
}

function getCurrentPath(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export default function ReturnScrollRestorer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useLayoutEffect(() => {
    if (!pathname) return;

    const currentPath = getCurrentPath();
    const pendingPath = sessionStorage.getItem(SCROLL_RESTORE_PENDING_KEY);

    if (!pendingPath || pendingPath !== currentPath) {
      return;
    }

    const rawY = sessionStorage.getItem(getScrollStorageKey(currentPath));
    const y = rawY ? Number.parseInt(rawY, 10) : Number.NaN;

    if (!Number.isFinite(y)) {
      sessionStorage.removeItem(SCROLL_RESTORE_PENDING_KEY);
      return;
    }

    // Restore before paint to avoid visible jump from top -> previous position.
    window.scrollTo(0, y);

    // Keep pending briefly so other route-level scroll-to-top effects
    // (with delayed timeouts) do not override this restore.
    const clearTimer = window.setTimeout(() => {
      sessionStorage.removeItem(SCROLL_RESTORE_PENDING_KEY);
    }, 500);

    return () => {
      window.clearTimeout(clearTimer);
    };
  }, [pathname, searchParams]);

  return null;
}
