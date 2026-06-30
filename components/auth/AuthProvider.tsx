"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import "@neondatabase/auth-ui/css";
import { authClient } from "@/lib/auth/client";
import React from "react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [baseURL] = useState(() =>
    typeof window !== "undefined" ? window.location.origin : ""
  );

  return (
    <NeonAuthUIProvider
      authClient={authClient as React.ComponentProps<typeof NeonAuthUIProvider>["authClient"]}
      baseURL={baseURL}
      magicLink
      emailOTP
      credentials
      signUp
      social={{ providers: ["google"] }}
      redirectTo="/"
      defaultTheme="light"
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      Link={Link}
      localization={{
        MAGIC_LINK: "Magic link",
        EMAIL_OTP: "Email code",
        PASSWORD: "Password",
      }}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
