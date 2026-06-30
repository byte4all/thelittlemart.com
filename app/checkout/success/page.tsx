"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { integralCF } from "@/styles/fonts";
import { cn } from "@/lib/utils";

/**
 * When the user lands here after paying on Billplz (redirect_url), we sync
 * payment status with Billplz in case the webhook did not fire. That updates
 * the order to CONFIRMED and sends the confirmation email.
 */
export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [syncing, setSyncing] = useState(!!orderId);
  const [paid, setPaid] = useState<boolean | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId?.trim()) {
      setSyncing(false);
      setPaid(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/shop/orders/${encodeURIComponent(orderId)}/sync-payment`, {
          method: "POST",
          credentials: "include",
        });
        const data = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          paid?: boolean;
          error?: string;
        };
        if (!cancelled) {
          if (!res.ok) {
            setPaid(null);
            setSyncError(data?.error || "Could not confirm payment yet.");
          } else {
            setPaid(typeof data?.paid === "boolean" ? data.paid : null);
            setSyncError(data?.error || null);
          }
          setSyncing(false);
        }
      } catch {
        if (!cancelled) {
          setPaid(null);
          setSyncError("Could not confirm payment yet.");
          setSyncing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0 py-12 text-center">
        <h2
          className={cn([
            integralCF.className,
            "font-bold text-[32px] md:text-[40px] text-brand uppercase mb-4",
          ])}
        >
          Thank you
        </h2>
        {syncing ? (
          <p className="text-black/60 mb-8">Confirming your payment…</p>
        ) : (
          <>
            <p className="text-black/70 mb-2">
              {paid === true
                ? "Your payment has been received."
                : paid === false
                  ? "Payment not confirmed yet."
                  : "Payment status pending."}
              {orderId && (
                <span className="block mt-2 text-sm">
                  Order reference: <strong>{orderId}</strong>
                </span>
              )}
            </p>
            {syncError ? (
              <p className="text-black/60 text-sm mb-8">{syncError}</p>
            ) : paid === true ? (
              <p className="text-black/60 text-sm mb-8">
                We will process your order and notify you when it ships.
              </p>
            ) : paid === null ? (
              <p className="text-black/60 text-sm mb-8">
                If you already paid, please wait a moment and refresh this page.
              </p>
            ) : null}
          </>
        )}
        <Button asChild className="rounded-full">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    </main>
  );
}
