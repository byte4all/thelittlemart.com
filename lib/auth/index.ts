import { prisma } from "@/lib/prisma";
import { addContactToResend } from "@/lib/resend";
import { neonAuth } from "./server";

export { neonAuth } from "./server";

type SyncedUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role?: string | null;
};

function isAuthUserAdmin(user: AuthUser): boolean {
  return user.role === "admin";
}

async function syncAuthUser(authUser: AuthUser): Promise<SyncedUser> {
  const email = authUser.email ?? `auth-${authUser.id}@user.local`;
  const name = authUser.name ?? null;
  const image = authUser.image ?? null;

  const user = await prisma.user.upsert({
    where: { id: authUser.id },
    create: {
      id: authUser.id,
      email,
      name,
      image,
    },
    update: {
      email,
      name,
      image,
    },
  });

  addContactToResend({ email: user.email, name: user.name }).catch((err) =>
    console.error("Resend sync after auth:", err)
  );

  return user;
}

async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const { data: session } = await neonAuth.getSession();
    return session?.user ?? null;
  } catch (error) {
    console.error("getSessionUser error:", error);
    return null;
  }
}

/**
 * Get the current Neon Auth user and sync to our Prisma User table.
 * Call this in API routes that need the current user.
 */
export async function getAuthUserAndSync(_request?: Request): Promise<SyncedUser | null> {
  try {
    const authUser = await getSessionUser();
    if (!authUser) return null;
    return syncAuthUser(authUser);
  } catch (error) {
    console.error("getAuthUserAndSync error:", error);
    return null;
  }
}

/** @deprecated Use getAuthUserAndSync */
export const getStackUserAndSync = getAuthUserAndSync;

/**
 * Get current session for API routes.
 * Returns { user } or null.
 */
export async function auth(_request?: Request): Promise<{
  user: { id: string; email: string; name: string | null; image: string | null };
} | null> {
  const user = await getAuthUserAndSync(_request);
  return user ? { user } : null;
}

export type AdminAuthResult =
  | { ok: true; user: SyncedUser }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Enforce signed-in user with Neon Auth admin role.
 */
export async function authAdmin(_request?: Request): Promise<AdminAuthResult> {
  try {
    const authUser = await getSessionUser();

    if (!authUser) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    if (!isAuthUserAdmin(authUser)) {
      return { ok: false, status: 403, error: "Forbidden" };
    }

    const user = await syncAuthUser(authUser);
    return { ok: true, user };
  } catch (error) {
    console.error("authAdmin error:", error);
    return { ok: false, status: 401, error: "Unauthorized" };
  }
}

/** Server component helper for guarding /admin pages. */
export async function currentUserIsAdmin(): Promise<boolean> {
  try {
    const authUser = await getSessionUser();
    if (!authUser) return false;
    return isAuthUserAdmin(authUser);
  } catch {
    return false;
  }
}

export async function getCurrentAdminGate(): Promise<{
  signedIn: boolean;
  isAdmin: boolean;
}> {
  try {
    const authUser = await getSessionUser();
    if (!authUser) {
      return { signedIn: false, isAdmin: false };
    }
    return {
      signedIn: true,
      isAdmin: isAuthUserAdmin(authUser),
    };
  } catch {
    return { signedIn: false, isAdmin: false };
  }
}
