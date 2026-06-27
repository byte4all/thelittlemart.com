"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthUser } from "@/lib/auth/client";
import { AUTH_LOGIN_PATH } from "@/lib/auth/login-path";

/**
 * User icon in navbar: links to /account (profile) when logged in,
 * Default login is magic link; password is available via the auth UI toggle.
 */
export default function UserProfileLink() {
  const user = useAuthUser();
  const href = user ? "/account" : AUTH_LOGIN_PATH;

  return (
    <Link href={href} className="p-1" aria-label={user ? "Account / profile" : "Sign in"}>
      <Image
        priority
        src="/icons/user.svg"
        height={100}
        width={100}
        alt="user"
        className="max-w-[22px] max-h-[22px]"
      />
    </Link>
  );
}
