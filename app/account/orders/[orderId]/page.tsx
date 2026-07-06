"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AccountShell from "@/components/account/AccountShell";
import { useAuthUser } from "@/lib/auth/client";
import { authLoginUrl } from "@/lib/auth/login-path";

type OrderItem = {
  productName: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  shipping: number;
  discountAmount: number;
  promoCode: string | null;
  createdAt: string;
  fulfillmentType: "pickup" | "shipping";
  trackingNumber: string | null;
  trackingUrl: string | null;
  pickupScheduledAt: string | null;
  items: OrderItem[];
};

function formatPickupTime(iso: string): string {
  return new Date(iso).toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function paymentBadgeStyle(paymentStatus: string) {
  if (paymentStatus === "COMPLETED") {
    return {
      backgroundColor: "var(--stack-success-bg,#dcfce7)",
      color: "var(--stack-success-text,#166534)",
    };
  }
  if (paymentStatus === "FAILED") {
    return {
      backgroundColor: "var(--stack-destructive-bg,#fee2e2)",
      color: "var(--stack-destructive-text,#991b1b)",
    };
  }
  return {
    backgroundColor: "var(--stack-muted-bg,#f3f4f6)",
    color: "var(--stack-muted-color,#6b7280)",
  };
}

export default function AccountOrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useAuthUser();
  const orderId = typeof params.orderId === "string" ? params.orderId : "";
  const justPaid = searchParams.get("paid") === "1";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.replace(authLoginUrl(`/account/orders/${orderId}`));
    }
  }, [user, router, orderId]);

  useEffect(() => {
    if (!orderId || user === null || user === undefined) return;
    let cancelled = false;
    fetch(`/api/shop/orders/${encodeURIComponent(orderId)}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((body) => {
            throw new Error(
              body.error ||
                (res.status === 401 ? "Please sign in." : "Failed to load order.")
            );
          });
        }
        return res.json();
      })
      .then((data: { order: Order }) => {
        if (!cancelled) setOrder(data.order);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Failed to load order.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, user]);

  if (user === undefined || (user === null && !error)) {
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
    <AccountShell>
      <p className="mb-4">
        <Link href="/account/orders" className="text-sm text-blue-600 hover:underline">
          ← Back to orders
        </Link>
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 py-4" role="alert">
          {error}
        </p>
      ) : order ? (
        <div className="space-y-6">
          {justPaid && order.paymentStatus === "COMPLETED" && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Your payment has been received. We will process your order and notify you when it
              ships.
            </div>
          )}

          <div>
            <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
            <p className="text-sm text-[var(--stack-muted-color,#6b7280)] mt-1">
              Placed{" "}
              {new Date(order.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
              style={paymentBadgeStyle(order.paymentStatus)}
            >
              {order.paymentStatus}
            </span>
            <span className="text-sm text-[var(--stack-muted-color,#6b7280)]">
              Order: {order.status}
            </span>
            <span className="text-xs text-[var(--stack-muted-color,#6b7280)]">
              {order.fulfillmentType === "pickup" ? "Pickup" : "Shipping"}
            </span>
          </div>

          <div>
            <h2 className="text-sm font-medium mb-2">Items</h2>
            <ul className="text-sm text-[var(--stack-muted-color,#6b7280)] space-y-1">
              {order.items.map((item, idx) => (
                <li key={idx}>
                  {item.productName} × {item.quantity} — RM{" "}
                  {(item.quantity * item.price).toFixed(2)}
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--stack-muted-color,#6b7280)]">Subtotal</span>
                <span>RM {order.subtotal.toFixed(2)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>
                    Promo{order.promoCode ? ` (${order.promoCode})` : ""}
                  </span>
                  <span>-RM {order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--stack-muted-color,#6b7280)]">Shipping</span>
                <span>{order.shipping > 0 ? `RM ${order.shipping.toFixed(2)}` : "FREE"}</span>
              </div>
            </div>
            <p className="mt-3 text-base font-semibold">Total: RM {order.total.toFixed(2)}</p>
          </div>

          {order.trackingUrl && (
            <p className="text-sm">
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Track shipment
                {order.trackingNumber ? ` (${order.trackingNumber})` : ""}
              </a>
            </p>
          )}

          {order.fulfillmentType === "pickup" && order.pickupScheduledAt && (
            <p className="text-sm text-[var(--stack-muted-color,#6b7280)]">
              Scheduled pickup: {formatPickupTime(order.pickupScheduledAt)}
            </p>
          )}
        </div>
      ) : null}
    </AccountShell>
  );
}
