import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthView } from "@neondatabase/auth-ui";
import { authViewPaths } from "@neondatabase/auth-ui/server";
import StoreRedirectAfterLogin from "@/components/auth/StoreRedirectAfterLogin";
import AuthCallbackComplete from "@/components/auth/AuthCallbackComplete";
import { authViewClassNames } from "@/components/auth/authViewClassNames";
import { noIndexMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

const titles: Record<string, string> = {
  "sign-in": "Sign In",
  "sign-up": "Sign Up",
  "magic-link": "Sign In",
  "email-otp": "Sign In with Code",
};

const pathsWithLoginExtras = new Set([
  "sign-in",
  "sign-up",
  "magic-link",
  "email-otp",
]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ path: string }>;
}): Promise<Metadata> {
  const { path } = await params;
  const title = titles[path];
  return title ? noIndexMetadata(title) : { robots: { index: false, follow: false } };
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  const showExtras = pathsWithLoginExtras.has(path);
  const isCallback = path === "callback";
  const isPasswordlessEntry =
    path === "magic-link" || path === "email-otp" || path === "sign-in";

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-10">
      {showExtras && (
        <Suspense fallback={null}>
          <StoreRedirectAfterLogin />
        </Suspense>
      )}
      <AuthView path={path} classNames={authViewClassNames} />
      {isCallback && (
        <Suspense fallback={null}>
          <AuthCallbackComplete />
        </Suspense>
      )}
      {showExtras && (
        <p className="text-center text-sm text-black/60 mt-4 max-w-sm">
          When{" "}
          {isPasswordlessEntry ? "signing in" : "signing up"}, you agree to our{" "}
          <a href="/terms-of-service" className="underline">
            Terms
          </a>
        </p>
      )}
    </main>
  );
}
