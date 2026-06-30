"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { integralCF } from "@/styles/fonts";
import { cn } from "@/lib/utils";

type SyncResponse = {
  success?: boolean;
  paid?: boolean;
  paymentFailed?: boolean;
  paymentStatus?: string;
  orderNumber?: string;
  error?: string;
};

/**
 * When the user lands here after paying on Billplz (redirect_url), we sync
 * payment status with Billplz in case the webhook did not fire. That updates
 * the order to CONFIRMED and sends the confirmation email, then redirects.
 */
export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order");
  const [syncing, setSyncing] = useState(!!orderId);
  const [redirecting, setRedirecting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId?.trim()) {
      setSyncing(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/shop/orders/${encodeURIComponent(orderId)}/sync-payment`, {
          method: "POST",
          credentials: "include",
        });
        const data = (await res.json().catch(() => ({}))) as SyncResponse;
        if (cancelled) return;

        if (!res.ok) {
          setSyncError(data?.error || "Could not confirm payment yet.");
          setSyncing(false);
          return;
        }

        if (data.paid === true) {
          setRedirecting(true);
          router.replace(`/account/orders/${encodeURIComponent(orderId)}?paid=1`);
          return;
        }

        if (data.paid === false) {
          setRedirecting(true);
          router.replace("/cart?checkout=pending");
          return;
        }

        setSyncError("Could not confirm payment yet.");
        setSyncing(false);
      } catch {
        if (!cancelled) {
          setSyncError("Could not confirm payment yet.");
          setSyncing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  const showLoading = syncing || redirecting;

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0 py-12 text-center">
        {showLoading ? (
          <>
            <h2
              className={cn([
                integralCF.className,
                "font-bold text-[32px] md:text-[40px] text-brand uppercase mb-4",
              ])}
            >
              Thank you
            </h2>
            <p className="text-black/60 mb-8">Confirming your payment…</p>
          </>
        ) : (
          <>
            <h2
              className={cn([
                integralCF.className,
                "font-bold text-[32px] md:text-[40px] text-brand uppercase mb-4",
              ])}
            >
              Payment status
            </h2>
            <p className="text-black/70 mb-2">
              {syncError ?? "We could not confirm your payment."}
              {orderId && (
                <span className="block mt-2 text-sm">
                  Order reference: <strong>{orderId}</strong>
                </span>
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/account/orders">My orders</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/cart">Back to cart</Link>
              </Button>
            </div>
          </>
        )}
        {!showLoading && (
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/shop">Continue shopping</Link>
          </Button>
        )}
      </div>
    </main>
  );
}
