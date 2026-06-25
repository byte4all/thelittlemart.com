"use client";

import { createAuthClient } from "@neondatabase/auth/next";

export const authClient = createAuthClient();

export const { useSession } = authClient;

/** Drop-in replacement for Stack's useUser({ or: "return-null" }). */
export function useAuthUser() {
  const { data, isPending } = useSession();
  if (isPending) return undefined;
  return data?.user ?? null;
}
