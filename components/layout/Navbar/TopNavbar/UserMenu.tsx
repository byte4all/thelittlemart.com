"use client";

import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@neondatabase/auth-ui";
import { useAuthUser } from "@/lib/auth/client";
import { AUTH_LOGIN_PATH } from "@/lib/auth/login-path";

/**
 * Signed-in: Neon UserButton (account menu + sign out).
 * Signed-out: link to sign-in.
 */
export default function UserMenu() {
  const user = useAuthUser();

  if (user === undefined) {
    return <span className="inline-block w-[34px] h-[34px]" aria-hidden />;
  }

  if (user) {
    return (
      <UserButton
        size="icon"
        classNames={{
          trigger: {
            base: "p-1 rounded-full hover:bg-black/5",
          },
        }}
      />
    );
  }

  return (
    <Link
      href={AUTH_LOGIN_PATH}
      className="p-1"
      aria-label="Sign in"
    >
      <Image
        priority
        src="/icons/user.svg"
        height={100}
        width={100}
        alt=""
        className="max-w-[22px] max-h-[22px]"
      />
    </Link>
  );
}
