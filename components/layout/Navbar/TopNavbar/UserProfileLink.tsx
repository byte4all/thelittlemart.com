"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthUser } from "@/lib/auth/client";

/**
 * User icon in navbar: links to /account (profile) when logged in,
 * /auth/sign-in when logged out. Prevents redirect to homepage when clicking profile.
 */
export default function UserProfileLink() {
  const user = useAuthUser();
  const href = user ? "/account" : "/auth/sign-in";

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
