"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthUser } from "@/lib/auth/client";
import PaymentsSection from "@/components/account/PaymentsSection";

export default function AccountPaymentsPage() {
  const router = useRouter();
  const user = useAuthUser();

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.replace(
        `/auth/sign-in?redirect=${encodeURIComponent("/account/payments")}`
      );
    }
  }, [user, router]);

  if (user === undefined) {
    return (
      <main className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand border-t-transparent" />
      </main>
    );
  }

  if (user === null) {
    return null;
  }

  return (
    <main className="pt-10 pb-20 px-4 xl:px-0 max-w-frame mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-6">My Orders</h1>
      <PaymentsSection />
    </main>
  );
}
