"use client";

import { useAuthUser } from "@/lib/auth/client";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { RootState } from "@/lib/store";
import { setCartFromServer } from "@/lib/features/carts/cartsSlice";
import type { CartItem } from "@/lib/features/carts/cartsSlice";
import { useCallback, useEffect, useRef } from "react";

type ApiCartItem = {
  id: string;
  name: string;
  slug?: string;
  price: unknown;
  thumbnail?: string | null;
  images?: string[];
  quantity: number;
  availableQuantity?: number;
  brand?: string;
};

/** Clamp quantity coming from server/DB using available stock and a sane upper bound. */
function clampServerQuantity(quantity: number, availableQuantity?: number): number {
  const base = Math.max(1, quantity);
  const withStockLimit =
    typeof availableQuantity === "number"
      ? Math.min(base, availableQuantity)
      : base;
  // Mirror GLOBAL_MAX_QUANTITY_PER_ITEM from cartsSlice (kept local to avoid coupling).
  const GLOBAL_MAX_QUANTITY_PER_ITEM = 20;
  return Math.min(withStockLimit, GLOBAL_MAX_QUANTITY_PER_ITEM);
}

/** Map one API cart item to CartItem for Redux. */
function mapApiCartItemToCartItem(apiItem: ApiCartItem): CartItem {
  const price = Number(apiItem.price) || 0;
  const srcUrl =
    apiItem.thumbnail ||
    (Array.isArray(apiItem.images) && apiItem.images[0]) ||
    "/images/placeholder.png";
  const safeQuantity = clampServerQuantity(
    apiItem.quantity,
    apiItem.availableQuantity
  );
  return {
    id: apiItem.id,
    name: apiItem.name,
    srcUrl,
    price,
    attributes: [],
    discount: { amount: 0, percentage: 0 },
    quantity: safeQuantity,
    availableQuantity: apiItem.availableQuantity,
    ...(apiItem.slug && { slug: apiItem.slug }),
    ...(apiItem.brand && { brand: apiItem.brand }),
  };
}

/** Merge API items by product id so one CartItem per product (sum quantities). Prevents doubled display when DB has duplicate rows. */
function mergeApiCartItems(apiItems: ApiCartItem[]): CartItem[] {
  const byId = new Map<string, { item: ApiCartItem; quantity: number }>();
  for (const apiItem of apiItems) {
    const id = String(apiItem.id);
    const qty = apiItem.quantity;
    const existing = byId.get(id);
    if (existing) {
      existing.quantity += qty;
    } else {
      byId.set(id, { item: apiItem, quantity: qty });
    }
  }
  return Array.from(byId.values()).map(({ item, quantity }) =>
    mapApiCartItemToCartItem({ ...item, quantity })
  );
}

/** Merge server cart with guest cart (same product id => sum quantities; guest-only items appended). */
function mergeGuestCartWithServer(
  serverItems: CartItem[],
  guestItems: CartItem[]
): CartItem[] {
  const byId = new Map<string, CartItem>();
  for (const item of serverItems) {
    byId.set(String(item.id), { ...item });
  }
  for (const item of guestItems) {
    const id = String(item.id);
    const existing = byId.get(id);
    if (existing) {
      const maxQty =
        existing.availableQuantity ?? item.availableQuantity ?? undefined;
      const combined =
        (existing.quantity ?? 0) + (item.quantity ?? 0);
      const safeQuantity =
        typeof maxQty === "number"
          ? Math.min(combined, Math.max(1, maxQty))
          : Math.max(1, combined);
      existing.quantity = safeQuantity;
      if (item.slug && !existing.slug) existing.slug = item.slug;
      if (item.availableQuantity != null) existing.availableQuantity = item.availableQuantity;
    } else {
      const maxQty =
        item.availableQuantity ?? undefined;
      const qty =
        typeof item.quantity === "number"
          ? Math.min(Math.max(1, item.quantity), maxQty ?? item.quantity)
          : 1;
      byId.set(id, { ...item, quantity: qty });
    }
  }
  return Array.from(byId.values());
}

/** Persists across remounts (e.g. navigation, Strict Mode). Ensures we only merge guest+server once per user; later loads just replace with server. */
let loadedForUserId: string | null = null;

/**
 * When the user is signed in:
 * - Load their saved cart from the API and hydrate Redux (so cart survives logout → login).
 * - When local cart changes, persist it to the API (debounced).
 */
export default function CartSync() {
  const user = useAuthUser();
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state: RootState) => state.carts.cart);
  const prevUserId = useRef<string | null>(null);
  const syncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  // When user logs out (had id, now null), clear cart and module-level flag so next login does a fresh merge.
  useEffect(() => {
    const hadUser = prevUserId.current != null;
    const hasUser = user?.id != null;
    prevUserId.current = user?.id ?? null;
    if (!hasUser) {
      loadedForUserId = null;
      if (hadUser) dispatch(setCartFromServer([]));
    }
  }, [user?.id, dispatch]);

  // On login (or remount while logged in): fetch server cart.
  // We only merge guest cart into server cart when the server cart is empty,
  // otherwise we treat the server cart as the single source of truth to avoid
  // quantities growing on every reload (guest already contains the last synced state).
  useEffect(() => {
    if (!user?.id) return;
    const isFirstLoadForUser = loadedForUserId !== user.id;
    if (isFirstLoadForUser) loadedForUserId = user.id;
    const guestItems = cartRef.current?.items ?? [];

    fetch("/api/shop/cart", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !Array.isArray(data.items)) {
          if (guestItems.length > 0 && isFirstLoadForUser)
            dispatch(setCartFromServer(mergeGuestCartWithServer([], guestItems)));
          return;
        }
        const serverItems = mergeApiCartItems(data.items);
        const merged =
          isFirstLoadForUser && serverItems.length === 0
            ? mergeGuestCartWithServer(serverItems, guestItems)
            : serverItems;
        dispatch(setCartFromServer(merged));
      })
      .catch(() => {
        if (isFirstLoadForUser) loadedForUserId = null;
        if (guestItems.length > 0 && isFirstLoadForUser)
          dispatch(setCartFromServer(mergeGuestCartWithServer([], guestItems)));
      });
  }, [user?.id, dispatch]);

  // Persist cart to API when user is logged in and cart changes (debounced).
  // Group by slug and sum quantities so we never create duplicate cart_items per product.
  const syncCartToServer = useCallback(() => {
    if (!user?.id || !cart?.items?.length) return;
    // Only allow the active/visible tab to write to the server cart to avoid
    // background tabs restoring stale carts or deleted items.
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }
    const itemsWithSlug = cart.items.filter((item): item is typeof item & { slug: string } => Boolean(item.slug));
    if (itemsWithSlug.length === 0) return;

    const bySlug = new Map<string, number>();
    for (const item of itemsWithSlug) {
      const q = bySlug.get(item.slug) ?? 0;
      bySlug.set(item.slug, q + item.quantity);
    }
    const items = Array.from(bySlug.entries()).map(([slug, quantity]) => ({ slug, quantity }));

    fetch("/api/shop/cart", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    }).catch(() => {});
  }, [user?.id, cart?.items]);

  useEffect(() => {
    if (!user?.id) return;
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(syncCartToServer, 800);
    return () => {
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
    };
  }, [user?.id, cart?.items, syncCartToServer]);

  return null;
}
