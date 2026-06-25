"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import "@neondatabase/auth-ui/css";
import { authClient } from "@/lib/auth/client";

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
      authClient={authClient}
      baseURL={baseURL}
      magicLink
      credentials
      signUp
      social={{ providers: ["google"] }}
      redirectTo="/"
      defaultTheme="light"
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      Link={Link}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
