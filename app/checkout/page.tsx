"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import FulfillmentSelector, {
  FulfillmentSummaryRow,
} from "@/components/cart/FulfillmentSelector";
import PickupAddressLink from "@/components/cart/PickupAddressLink";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { setFulfillmentMethod } from "@/lib/features/carts/cartsSlice";
import { RootState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import InputGroup from "@/components/ui/input-group";
import { integralCF } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { roundTo2 } from "@/lib/currency";
import { calcDeliveryFee } from "@/lib/fulfillment";
import { useAuthUser } from "@/lib/auth/client";
import { authLoginUrl } from "@/lib/auth/login-path";

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAuthUser();
  const { cart, totalPrice, fulfillmentMethod } = useAppSelector(
    (state: RootState) => state.carts
  );
  const { formatPrice } = useCurrency();
  const subtotalRounded = roundTo2(totalPrice);
  const deliveryFee = calcDeliveryFee(subtotalRounded, fulfillmentMethod);
  const orderTotalRounded = roundTo2(subtotalRounded + deliveryFee);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.replace(authLoginUrl("/checkout"));
    }
  }, [user, router]);

  const [shipping, setShipping] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "Malaysia",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (fulfillmentMethod === "shipping") {
      const zipNum = parseInt(shipping.zip.replace(/\D/g, "").slice(0, 5), 10);
      if (Number.isNaN(zipNum) || zipNum < 50000 || zipNum > 60000) {
        setError(
          "We only deliver to Kuala Lumpur. Please enter a postcode between 50000 and 60000."
        );
        return;
      }
    }

    if (!shipping.fullName.trim() || !shipping.phone.trim()) {
      setError("Full name and phone are required.");
      return;
    }

    if (fulfillmentMethod === "shipping" && !shipping.address.trim()) {
      setError("Address is required for shipping.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const items = cart.items.map((item) => ({
        id: String(item.id),
        quantity: item.quantity,
      }));
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillmentMethod,
          shippingAddress: {
            fullName: shipping.fullName,
            phone: shipping.phone,
            address: shipping.address,
            city: shipping.city,
            state: shipping.state,
            zip: shipping.zip,
            country: shipping.country,
          },
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed.");
        setLoading(false);
        return;
      }
      if (data.billUrl) {
        window.location.href = data.billUrl;
        return;
      }
      router.push(`/checkout/success?order=${data.orderId}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (user === undefined || user === null) {
    return (
      <main className="pb-20 max-w-frame mx-auto px-4 xl:px-0 py-12 flex flex-col items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand border-t-transparent mb-4" />
        <p className="text-foreground/60">Redirecting to sign in…</p>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="pb-20 max-w-frame mx-auto px-4 xl:px-0 py-12">
        <p className="text-foreground/60 mb-4">Your cart is empty.</p>
        <Button asChild className="rounded-full">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </main>
    );
  }


  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <h2
          className={cn([
            integralCF.className,
            "font-bold text-[32px] md:text-[40px] uppercase mb-6 text-center text-brand",
          ])}
        >
          Checkout
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <FulfillmentSelector
              method={fulfillmentMethod}
              onChange={(method) => dispatch(setFulfillmentMethod(method))}
              subtotal={subtotalRounded}
              formatPrice={formatPrice}
            />

            <InputGroup className="bg-[#F0F0F0]">
              <InputGroup.Input
                required
                placeholder="Full name *"
                value={shipping.fullName}
                onChange={(e) =>
                  setShipping((s) => ({ ...s, fullName: e.target.value }))
                }
                className="bg-transparent"
              />
            </InputGroup>
            <InputGroup className="bg-[#F0F0F0]">
              <InputGroup.Input
                type="tel"
                required
                placeholder="Phone *"
                value={shipping.phone}
                onChange={(e) =>
                  setShipping((s) => ({ ...s, phone: e.target.value }))
                }
                className="bg-transparent"
              />
            </InputGroup>

            {fulfillmentMethod === "pickup" ? (
              <div className="rounded-xl border border-brand/10 p-4 bg-brand/5">
                <p className="text-sm font-medium text-brand mb-1">
                  Pickup location
                </p>
                <PickupAddressLink />
              </div>
            ) : (
              <>
                <InputGroup className="bg-[#F0F0F0]">
                  <InputGroup.Input
                    required
                    placeholder="Address *"
                    value={shipping.address}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, address: e.target.value }))
                    }
                    className="bg-transparent"
                  />
                </InputGroup>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputGroup className="bg-[#F0F0F0]">
                    <InputGroup.Input
                      placeholder="City"
                      value={shipping.city}
                      onChange={(e) =>
                        setShipping((s) => ({ ...s, city: e.target.value }))
                      }
                      className="bg-transparent"
                    />
                  </InputGroup>
                  <InputGroup className="bg-[#F0F0F0]">
                    <InputGroup.Input
                      placeholder="State"
                      value={shipping.state}
                      onChange={(e) =>
                        setShipping((s) => ({ ...s, state: e.target.value }))
                      }
                      className="bg-transparent"
                    />
                  </InputGroup>
                </div>
                <InputGroup className="bg-[#F0F0F0]">
                  <InputGroup.Input
                    placeholder="Postcode (Kuala Lumpur: 50000–60000)"
                    value={shipping.zip}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, zip: e.target.value }))
                    }
                    className="bg-transparent"
                    maxLength={5}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  <p className="text-xs text-foreground/50 mt-1">
                    Kuala Lumpur: 50000–60000
                  </p>
                </InputGroup>
                <InputGroup className="bg-[#F0F0F0]">
                  <InputGroup.Input
                    placeholder="Country"
                    value={shipping.country}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, country: e.target.value }))
                    }
                    className="bg-transparent"
                  />
                </InputGroup>
              </>
            )}
          </div>
          <div className="lg:w-[400px] p-5 rounded-[20px] border border-brand/10 h-fit space-y-4">
            <h6 className="text-xl font-bold text-foreground">Order total</h6>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/60">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotalRounded)}</span>
              </div>
              <FulfillmentSummaryRow
                method={fulfillmentMethod}
                subtotal={subtotalRounded}
                formatPrice={formatPrice}
              />
              <hr className="border-t-brand/10" />
              <p className="text-2xl font-bold">{formatPrice(orderTotalRounded)}</p>
            </div>
            <p className="text-sm text-foreground/60">
              You will be redirected to Billplz to pay securely.
            </p>
            {error && (
              <p className="text-red-600 text-sm" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full h-12 font-medium"
            >
              {loading ? "Processing…" : "Proceed to payment"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
